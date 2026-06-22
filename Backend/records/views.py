from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Q, OuterRef, Subquery, IntegerField
from core.permissions import IsOwner, ActiveSubscriptionRequired
from financial_operations.models import Payment, Enrollment
from django.utils import timezone
from .models import ClassSession, Attendance
from .serializers import (
    ClassSessionSerializer,
    AttendanceSerializer,
    AttendanceBulkSerializer,
)



def get_annotated_sessions(academy_id, class_id=None):
    from structure.models import ClassSessionEnrollment
    qs = ClassSessionEnrollment.objects.filter(
        class_obj__academy_id=academy_id
    )
    if class_id:
        qs = qs.filter(class_obj__id=class_id)

    session_ids = qs.values_list('session_id', flat=True)

    sessions = list(ClassSession.objects.filter(  # force evaluate
        id__in=session_ids
    ).annotate(
        present_count=Count(
            'attendance_records',
            filter=Q(attendance_records__present=True)
        ),
        absent_count=Count(
            'attendance_records',
            filter=Q(attendance_records__present=False)
        ),
        total_enrolled=Count('attendance_records'),
    ))

    if class_id:
        junction_map = {
            str(e.session_id): e.session_num
            for e in qs
        }
        for s in sessions:
            s.session_num = junction_map.get(str(s.id), None)
        sessions.sort(key=lambda s: s.session_num or 0)

    return sessions

class ClassSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    permission_classes = [IsOwner, ActiveSubscriptionRequired]
    pagination_class = None

    def get_queryset(self):
        if self.action in ['destroy', 'retrieve', 'attendance']:
            return ClassSession.objects.filter(
                class_links__class_obj__academy_id=self.request.user.academy_id
            )
        class_id = self.request.query_params.get('class_id')
        return get_annotated_sessions(
            self.request.user.academy_id,
            class_id=class_id
        )

    @action(detail=True, methods=['get', 'post'], url_path='attendance')
    def attendance(self, request, pk=None):
        session = self.get_object()

        if request.method == 'GET':
            records = Attendance.objects.filter(
                session=session
            ).select_related('enrollment__student_id')
            serializer = AttendanceSerializer(records, many=True)
            return Response(serializer.data)

        serializer = AttendanceBulkSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)
        
        records = serializer.validated_data['records']
        created, updated = 0, 0

        with transaction.atomic():
            for record in records:
                _, was_created = Attendance.objects.update_or_create(
                    session=session,
                    enrollment_id=record['enrollment_id'],
                    defaults={'present': record['present']}
                )
                # payment trigger
                if record['present']:
                    self._create_pending_payment(record['enrollment_id'])

                if was_created:
                    created += 1
                else:
                    updated += 1

        return Response(
            {'created': created, 'updated': updated},
            status=status.HTTP_200_OK
        )

    def destroy(self, request, pk=None):
        session = self.get_object()
        with transaction.atomic():
            Attendance.objects.filter(session=session).delete()
            from structure.models import ClassSessionEnrollment
            ClassSessionEnrollment.objects.filter(session=session).delete()
            session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _create_pending_payment(self, enrollment_id):

        try:
            enrollment = Enrollment.objects.get(id=enrollment_id)
            if not Payment.objects.filter(
                enrollment_id=enrollment,
                status='pending'
            ).exists():
                cls = enrollment.class_id
                amount = (
                    cls.session_count * cls.session_price
                    if cls.session_count and cls.session_price
                    else 0
                )
                Payment.objects.create(
                    enrollment_id=enrollment,
                    due_date=timezone.now().date(),
                    status='pending',
                    amount=amount
                )
        except Enrollment.DoesNotExist:
            pass


class StudentAttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    http_method_names = ['get', 'head', 'options']
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def get_queryset(self):
        return Attendance.objects.filter(
            enrollment__student_id__id=self.kwargs.get('student_id'),
            enrollment__class_id__academy_id=self.request.user.academy_id,
        )

    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request, student_id=None):
        class_id = request.query_params.get('class_id')
        if not class_id:
            raise ValidationError("class_id query param is required.")

        records = self.get_queryset().filter(
            enrollment__class_id__id=class_id
        )

        total = records.count()
        present = records.filter(present=True).count()
        absent = total - present
        pct = round((present / total) * 100, 1) if total > 0 else 0

        return Response({
            'total_sessions': total,
            'present_count': present,
            'absent_count': absent,
            'attendance_pct': pct,
        })

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request, student_id=None):
        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response(
                {'detail': 'class_id query param is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from structure.models import ClassSessionEnrollment
        records = self.get_queryset().filter(
            enrollment__class_id__id=class_id
        ).select_related('session').order_by('session__session_date')

        junction = {
            str(e.session_id): e.session_num
            for e in ClassSessionEnrollment.objects.filter(
                class_obj__id=class_id
            )
        }

        data = [
            {
                'session_num': junction.get(str(r.session_id)),
                'session_date': r.session.session_date,
                'present': r.present,
            }
            for r in records
        ]
        return Response(data)


class ClassAttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    http_method_names = ['get', 'head', 'options']
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def get_queryset(self):
        return get_annotated_sessions(
            self.request.user.academy_id,
            class_id=self.kwargs.get('class_id')
        ).order_by('session_date')

    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request, class_id=None):
        from structure.models import ClassSessionEnrollment
        sessions = self.get_queryset()
        junction = {
            str(e.session_id): e.session_num
            for e in ClassSessionEnrollment.objects.filter(
                class_obj__id=class_id
            )
        }

        data = [
            {
                'session_num': junction.get(str(s.id)),
                'session_date': s.session_date,
                'present_count': s.present_count,
                'total_enrolled': s.total_enrolled,
                'turnout_pct': (
                    round((s.present_count / s.total_enrolled) * 100, 1)
                    if s.total_enrolled > 0 else 0
                ),
            }
            for s in sessions
        ]
        return Response(data)
    
class GenerateSessionsView(APIView):
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def post(self, request, class_id):
        from datetime import date, timedelta
        from structure.models import ClassSchedule, ClassSessionEnrollment, Class

        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')

        if not start_date_str or not end_date_str:
            raise ValidationError({"start_date": ["This field is required."], "end_date": ["This field is required."]})

        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            raise ValidationError({"end_date": ["Invalid date format. Use YYYY-MM-DD."]})

        if end_date < start_date:
            raise ValidationError({"end_date": ["end_date must be after start_date."]})
            

        try:
            cls = Class.objects.get(
                id=class_id,
                academy_id=request.user.academy_id
            )
        except Class.DoesNotExist:
            raise ValidationError({"class_id": ["Class not found."]})

        schedules = ClassSchedule.objects.filter(class_obj=cls)
        if not schedules.exists():
            raise ValidationError({"class_id": ["No schedules found for this class."]})

        sessions_created = 0
        skipped = 0

        with transaction.atomic():
            last_junction = (
                ClassSessionEnrollment.objects
                .select_for_update()
                .filter(class_obj=cls)
                .order_by('session_num')
                .last()
            )
            next_session_num = (last_junction.session_num + 1) if last_junction else 1
            max_sessions = cls.session_count  # cap

            current_date = start_date
            while current_date <= end_date:
                matching_slots = [
                    s for s in schedules
                    if s.day_of_week == current_date.weekday()
                ]

                for slot in matching_slots:
                    if max_sessions and next_session_num > max_sessions:
                        skipped += 1
                        continue  # stop creating, count as skipped

                    exists = ClassSession.objects.filter(
                        session_date=current_date,
                        session_time=slot.start_time
                    ).exists()

                    if exists:
                        skipped += 1
                    else:
                        session = ClassSession.objects.create(
                            session_date=current_date,
                            session_time=slot.start_time,
                            notes=''
                        )
                        ClassSessionEnrollment.objects.create(
                            session=session,
                            class_obj=cls,
                            session_num=next_session_num,
                        )
                        next_session_num += 1
                        sessions_created += 1

                current_date += timedelta(days=1)

        return Response(
            {'sessions_created': sessions_created, 'skipped': skipped},
            status=status.HTTP_200_OK
        )