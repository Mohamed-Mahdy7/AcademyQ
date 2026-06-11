from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, Q
from core.permissions import IsOwner, ActiveSubscriptionRequired
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
                'enrollment__student__user'
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