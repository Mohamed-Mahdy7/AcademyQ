from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, Q
from .models import SubjectSession, Attendance
from .serializers import (
    SubjectSessionSerializer,
    AttendanceSerializer,
    AttendanceBulkSerializer,
)


class SubjectSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = SubjectSessionSerializer

    def get_queryset(self):
        academy_id = self.request.user.academy_id
        qs = SubjectSession.objects.filter(
            class_obj__academy_id=academy_id
        ).annotate(
            present_count=Count('attendance_records', filter=Q(attendance_records__present=True)),
            absent_count=Count('attendance_records', filter=Q(attendance_records__present=False)),
            total_enrolled=Count('attendance_records'),
        ).order_by('-session_num')

        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_obj__id=class_id)
        return qs


class SubjectSessionDetailView(generics.RetrieveAPIView):
    serializer_class = SubjectSessionSerializer

    def get_queryset(self):
        return SubjectSession.objects.filter(
            class_obj__academy_id=self.request.user.academy_id
        ).annotate(
            present_count=Count('attendance_records', filter=Q(attendance_records__present=True)),
            absent_count=Count('attendance_records', filter=Q(attendance_records__present=False)),
            total_enrolled=Count('attendance_records'),
        )


class AttendanceBulkView(APIView):
    """
    GET  /api/sessions/{id}/attendance/  — list records for a session
    POST /api/sessions/{id}/attendance/  — bulk create/update
    """

    def get_session(self, session_id, academy_id):
        try:
            return SubjectSession.objects.get(
                id=session_id,
                class_obj__academy_id=academy_id
            )
        except SubjectSession.DoesNotExist:
            return None

    def get(self, request, session_id):
        session = self.get_session(session_id, request.user.academy_id)
        if not session:
            return Response(
                {'detail': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        records = Attendance.objects.filter(session=session).select_related(
            'enrollment__student__user'
        )
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

    def post(self, request, session_id):
        session = self.get_session(session_id, request.user.academy_id)
        if not session:
            return Response(
                {'detail': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

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


class StudentAttendanceStatsView(APIView):
    """
    GET /api/students/{student_id}/attendance/stats/?class_id={id}
    """

    def get(self, request, student_id):
        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response(
                {'detail': 'class_id query param is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        records = Attendance.objects.filter(
            enrollment__student__id=student_id,
            enrollment__class_obj__id=class_id,
            enrollment__class_obj__academy_id=request.user.academy_id,
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


class StudentAttendanceHistoryView(APIView):
    """
    GET /api/students/{student_id}/attendance/history/?class_id={id}
    """

    def get(self, request, student_id):
        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response(
                {'detail': 'class_id query param is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        records = Attendance.objects.filter(
            enrollment__student__id=student_id,
            enrollment__class_obj__id=class_id,
            enrollment__class_obj__academy_id=request.user.academy_id,
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


class ClassAttendanceSummaryView(APIView):
    """
    GET /api/classes/{class_id}/attendance/summary/
    """

    def get(self, request, class_id):
        sessions = SubjectSession.objects.filter(
            class_obj__id=class_id,
            class_obj__academy_id=request.user.academy_id,
        ).annotate(
            present_count=Count('attendance_records', filter=Q(attendance_records__present=True)),
            total_enrolled=Count('attendance_records'),
        ).order_by('session_num')

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