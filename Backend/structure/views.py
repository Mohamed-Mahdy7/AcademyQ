from django.db.models import Count

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
        return Class.objects.select_related("academy", "subject").annotate(
            students_count=Count("enrollments"),
            sessions_count=Count("sessions"),
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ClassCreateSerializer
        if self.action in ["update", "partial_update"]:
            return ClassUpdateSerializer
        if self.action == "retrieve":
            return ClassDetailSerializer
        return ClassListSerializer
