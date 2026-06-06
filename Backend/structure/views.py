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
    SubjectUpdateSerializer
)

class SubjectViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return (
            Subject.objects
            .select_related("academy")
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