# records/urls.py
from django.urls import path
from .views import (
    SubjectSessionListCreateView,
    SubjectSessionDetailView,
    AttendanceBulkView,
    StudentAttendanceStatsView,
    StudentAttendanceHistoryView,
    ClassAttendanceSummaryView,
)

urlpatterns = [
    path('sessions/', SubjectSessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<uuid:pk>/', SubjectSessionDetailView.as_view(), name='session-detail'),

    path('sessions/<uuid:session_id>/attendance/', AttendanceBulkView.as_view(), name='attendance-bulk'),

    path('students/<uuid:student_id>/attendance/stats/', StudentAttendanceStatsView.as_view(), name='student-attendance-stats'),
    path('students/<uuid:student_id>/attendance/history/', StudentAttendanceHistoryView.as_view(), name='student-attendance-history'),

    path('classes/<uuid:class_id>/attendance/summary/', ClassAttendanceSummaryView.as_view(), name='class-attendance-summary'),
]