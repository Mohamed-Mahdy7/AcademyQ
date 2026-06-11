from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClassSessionViewSet,
    StudentAttendanceViewSet,
    ClassAttendanceViewSet,
)

router = DefaultRouter()
router.register(r'sessions', ClassSessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),

    path(
        'students/<uuid:student_id>/attendance/stats/',
        StudentAttendanceViewSet.as_view({'get': 'stats'}),
        name='student-attendance-stats'
    ),
    path(
        'students/<uuid:student_id>/attendance/history/',
        StudentAttendanceViewSet.as_view({'get': 'history'}),
        name='student-attendance-history'
    ),

    path(
        'classes/<uuid:class_id>/attendance/summary/',
        ClassAttendanceViewSet.as_view({'get': 'summary'}),
        name='class-attendance-summary'
    ),
]