from django.db.models import Count, Q, Avg, Case, When, FloatField
from django.utils import timezone
from datetime import timedelta

from rest_framework import viewsets

from .models import (
    Subject,
    Class,
)
from .serializers import (
    SubjectListSerializer,
    SubjectDetailSerializer,
    SubjectCreateSerializer,
    SubjectUpdateSerializer,
    ClassListSerializer,
    ClassDetailSerializer,
    ClassCreateSerializer,
    ClassUpdateSerializer
)


class SubjectViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return (
            Subject.objects.select_related("academy")
            .prefetch_related("classes")
            .annotate(classes_count=Count("classes"))
        )

    def get_serializer_class(self):
        if self.action == "create":
            return SubjectCreateSerializer
        if self.action in ["update", "partial_update"]:
            return SubjectUpdateSerializer
        if self.action == "retrieve":
            return SubjectDetailSerializer
        return SubjectListSerializer


class ClassViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        return (
            Class.objects.select_related("academy", "subject")
            .prefetch_related("teacher_assignments__teacher__user_id")
            .annotate(
                students_count=Count("enrollments", distinct=True),
                sessions_count=Count("sessions", distinct=True),
                sessions_this_week=Count(
                    "sessions",
                    filter=Q(sessions__session_date__range=(week_start, week_end)),
                    distinct=True,
                ),
                avg_attendance=Avg(
                    Case(
                        When(
                            sessions__attendance_records__present=True,
                            then=100.0
                        ),
                        default=0.0,
                        output_field=FloatField(),
                    )
                ),
            )
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ClassCreateSerializer
        if self.action in ["update", "partial_update"]:
            return ClassUpdateSerializer
        if self.action == "retrieve":
            return ClassDetailSerializer
        return ClassListSerializer
