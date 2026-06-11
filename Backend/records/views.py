from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, Q
from core.permissions import IsOwner, ActiveSubscriptionRequired
from datetime import date, timedelta
from structure.models import ClassSchedule
from .models import ClassSession, Attendance
from .serializers import (
    ClassSessionSerializer,
    AttendanceSerializer,
    AttendanceBulkSerializer,
)


class ClassSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    http_method_names = ['get', 'post', 'head', 'options']
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def get_queryset(self):
        qs = ClassSession.objects.filter(
            class_obj__academy_id=self.request.user.academy_id
        ).annotate(
            present_count=Count('attendance_records', filter=Q(attendance_records__present=True)),
            absent_count=Count('attendance_records', filter=Q(attendance_records__present=False)),
            total_enrolled=Count('attendance_records'),
        ).order_by('-session_num')

        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_obj__id=class_id)
        return qs

    @action(detail=True, methods=['get', 'post'], url_path='attendance')
    def attendance(self, request, pk=None):
        session = self.get_object()

        if request.method == 'GET':
            records = Attendance.objects.filter(session=session).select_related(
                'enrollment__student__id'
            )
            serializer = AttendanceSerializer(records, many=True)
            return Response(serializer.data)

        serializer = AttendanceBulkSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        records = serializer.validated_data['records']
        created, updated = 0, 0

        with transaction.atomic():
            for record in records:
                _, was_created = Attendance.objects.update_or_create(
                    session=session,
                    enrollment_id=record['enrollment_id'],
                    defaults={'present': record['present']}
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        return Response(
            {'created': created, 'updated': updated},
            status=status.HTTP_200_OK
        )


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
            return Response(
                {'detail': 'class_id query param is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        records = self.get_queryset().filter(
            enrollment__class_id__id=class_id
        ).select_related('session').order_by('session__session_date')

        data = [
            {
                'session_num': r.session.session_num,
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
        return ClassSession.objects.filter(
            class_obj__id=self.kwargs.get('class_id'),
            class_obj__academy_id=self.request.user.academy_id,
        ).annotate(
            present_count=Count('attendance_records', filter=Q(attendance_records__present=True)),
            total_enrolled=Count('attendance_records'),
        ).order_by('session_num')

    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request, class_id=None):
        sessions = self.get_queryset()

        data = [
            {
                'session_num': s.session_num,
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
    
class GenerateSessionsViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    http_method_names = ['post', 'head', 'options']
    permission_classes = [IsOwner, ActiveSubscriptionRequired]

    def get_queryset(self):
        return ClassSession.objects.filter(
            class_obj__academy_id=self.request.user.academy_id
        )

    @action(detail=False, methods=['post'], url_path='generate-sessions')
    def generate_sessions(self, request, class_id=None):
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')

        if not start_date_str or not end_date_str:
            return Response(
                {'detail': 'start_date and end_date are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            return Response(
                {'detail': 'Invalid date format. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if end_date < start_date:
            return Response(
                {'detail': 'end_date must be after start_date.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # verify class belongs to this academy
        from structure.models import Class
        try:
            cls = Class.objects.get(
                id=class_id,
                academy_id=request.user.academy_id
            )
        except Class.DoesNotExist:
            return Response(
                {'detail': 'Class not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # fetch schedule slots
        schedules = ClassSchedule.objects.filter(class_obj=cls)
        if not schedules.exists():
            return Response(
                {'detail': 'No schedule configured for this class. Add schedule slots before generating sessions.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # build lookup of existing sessions for this class in date range
        existing = set(
            ClassSession.objects.filter(
                class_obj=cls,
                session_date__range=(start_date, end_date)
            ).values_list('session_date', flat=True)
        )

        sessions_created = 0
        skipped = 0

        with transaction.atomic():
            # lock existing sessions for this class to prevent race conditions
            last = (
                ClassSession.objects
                .select_for_update()
                .filter(class_obj=cls)
                .order_by('session_num')
                .last()
            )
            next_session_num = (last.session_num + 1) if last else 1

            current_date = start_date
            while current_date <= end_date:
                # check if any schedule slot matches this day of week
                matching_slots = [
                    s for s in schedules
                    if s.day_of_week == current_date.weekday()
                ]

                for slot in matching_slots:
                    if current_date in existing:
                        skipped += 1
                    else:
                        ClassSession.objects.create(
                            class_obj=cls,
                            session_date=current_date,
                            session_num=next_session_num,
                            notes=''
                        )
                        existing.add(current_date)
                        next_session_num += 1
                        sessions_created += 1

                current_date += timedelta(days=1)

        return Response(
            {'sessions_created': sessions_created, 'skipped': skipped},
            status=status.HTTP_200_OK
        )