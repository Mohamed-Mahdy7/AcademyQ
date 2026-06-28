import logging
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer, extend_schema_view
from rest_framework.exceptions import ValidationError, NotFound
from django.db import transaction
from django.db.models import Count, Q, OuterRef, Subquery, IntegerField
from core.mixins import AcademyScopedMixin
from core.permissions import IsOwner, ActiveSubscriptionRequired
from financial_operations.models import Payment, Enrollment
from django.utils import timezone
from .models import ClassSession, Attendance
from datetime import date, timedelta
from structure.models import ClassSchedule, ClassSessionEnrollment, Class
from grades.models import Grade
from .serializers import (
    ClassSessionSerializer,
    AttendanceSerializer,
    AttendanceBulkSerializer,
)

logger = logging.getLogger(__name__)

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

@extend_schema_view(
    list=extend_schema(tags=["Class Session"]),
    retrieve=extend_schema(tags=["Class Session"]),
    create=extend_schema(tags=["Class Session"]),
    destroy=extend_schema(tags=["Class Session"]),
    attendance=extend_schema(tags=["Attendance"]),
)
class ClassSessionViewSet(AcademyScopedMixin, viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    permission_classes = [IsOwner, ActiveSubscriptionRequired]
    pagination_class = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ClassSession.objects.none()
        
        if self.action in ['destroy', 'retrieve', 'attendance','partial_update', 'update']:
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
        created, updated, failed = 0, 0, []

        for record in records:
            try:
                _, was_created = Attendance.objects.update_or_create(
                    session=session,
                    enrollment_id=record['enrollment_id'],
                    defaults={'present': record['present']}
                )
                if record['present']:
                    self._create_pending_payment(record['enrollment_id'])
                if was_created:
                    created += 1
                else:
                    updated += 1
            except Exception:
                logger.exception(
                    "attendance: failed to save record for enrollment %s",
                    record['enrollment_id']
                )
                failed.append(str(record['enrollment_id']))

        return Response(
            {'created': created, 'updated': updated, 'failed': failed},
            status=status.HTTP_200_OK
        )
    
    def partial_update(self, request, pk=None):
        session = self.get_object()

        # block reschedule if attendance already exists
        if Attendance.objects.filter(session=session).exists():
            raise ValidationError({
                "session": ["Cannot reschedule a session that already has attendance records."]
            })

        new_date = request.data.get('session_date')
        new_time = request.data.get('session_time')

        if not new_date and not new_time:
            raise ValidationError({
                "session_date": ["At least session_date or session_time is required."]
            })

        from django.utils import timezone
        if new_date:
            from datetime import date as date_type
            try:
                parsed = date_type.fromisoformat(new_date)
            except ValueError:
                raise ValidationError({"session_date": ["Invalid date format. Use YYYY-MM-DD."]})

            # get class date range via junction
            from structure.models import ClassSessionEnrollment
            junction = ClassSessionEnrollment.objects.filter(session=session).first()
            if junction:
                cls = junction.class_obj
                if parsed < cls.start_date:
                    raise ValidationError({"session_date": ["Date cannot be before the class start date."]})
                if parsed > cls.end_date:
                    raise ValidationError({"session_date": ["Date cannot be after the class end date."]})

            session.session_date = parsed

        if new_time:
            session.session_time = new_time

        session.save()
        return Response(ClassSessionSerializer(session).data)
    
    def destroy(self, request, pk=None):
        session = self.get_object()
        with transaction.atomic():
            Grade.objects.filter(session=session).delete()
            Attendance.objects.filter(session=session).delete()
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


@extend_schema_view(
    list=extend_schema(tags=["Attendance"]),
    retrieve=extend_schema(tags=["Attendance"]),
    create=extend_schema(tags=["Attendance"]),
    stats=extend_schema(tags=["Attendance"]),
    history=extend_schema(tags=["Attendance"]),
)
class StudentAttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    http_method_names = ['get', 'head', 'options']
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def get_queryset(self):
        return Attendance.objects.filter(
            enrollment__student_id__user_id=self.kwargs.get('student_id'),
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
            raise ValidationError({"class_id": ["class_id query param is required."]})

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
            raise ValidationError({"class_id": ["class_id query param is required."]})

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


@extend_schema_view(
    list=extend_schema(tags=["Attendance"]),
    retrieve=extend_schema(tags=["Attendance"]),
    create=extend_schema(tags=["Attendance"]),
    summary=extend_schema(tags=["Attendance"]),
)
class ClassAttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    http_method_names = ['get', 'head', 'options']
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def get_queryset(self):
        sessions = get_annotated_sessions(
        self.request.user.academy_id,
        class_id=self.kwargs.get('class_id')
    )
        return sorted(sessions, key=lambda s: s.session_date)

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
    
@extend_schema(
    tags=["Attendance"],
    request=inline_serializer(
        "GenerateSessionsRequest",
        fields={
            "start_date": serializers.DateField(),
            "end_date": serializers.DateField(),
        },
    ),
    responses={
        200: inline_serializer(
            "GenerateSessionsResponse",
            fields={
                "sessions_created": serializers.IntegerField(),
                "skipped": serializers.IntegerField(),
            },
        ),
        400: inline_serializer(
            "GenerateSessionsError",
            fields={"detail": serializers.CharField()},
        ),
        404: inline_serializer(
            "GenerateSessionsNotFound",
            fields={"detail": serializers.CharField()},
        ),
    },
)
class GenerateSessionsView(APIView):
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def post(self, request, class_id):

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
            if start_date > cls.end_date:
                raise ValidationError({
                    "start_date": ["Start date is after the class end date."]
                })
            if start_date < cls.start_date:
                raise ValidationError({
                    "start_date": ["Start date cannot be before the class start date."]
                })

            if end_date > cls.end_date:
                end_date = cls.end_date  # silently cap, or raise — your choice
        except Class.DoesNotExist:
            raise NotFound("Class not found.")

        schedules = ClassSchedule.objects.filter(class_obj=cls)
        if not schedules.exists():
            raise ValidationError({"class_id": ["No schedules found for this class."]})

        sessions_created = 0
        skipped_existing = 0
        skipped_limit = 0

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
                        skipped_limit += 1
                        continue  # stop creating, count as skipped

                    exists = ClassSession.objects.filter(
                        session_date=current_date,
                        session_time=slot.start_time
                    ).exists()

                    if exists:
                        skipped_existing += 1
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

        if sessions_created == 0 and skipped_existing == 0 and skipped_limit == 0:
            raise ValidationError({
                "start_date": ["No sessions were created. The selected date range contains no days matching this class's schedule."]
            })

        return Response({
            'sessions_created': sessions_created,
            'skipped_existing': skipped_existing,
            'skipped_limit': skipped_limit,
        }, status=status.HTTP_200_OK)