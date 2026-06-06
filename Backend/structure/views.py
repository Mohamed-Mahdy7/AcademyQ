from django.db.models import Count, Prefetch, Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from financial_operations.models import Enrollment
from .serializers.detail import (
    ClassDetailSerializer,
    ClassStudentSerializer,
    SubjectDetailSerializer,
)
from .serializers.list import (
    ClassListSerializer,
    SubjectListSerializer,
)
from .serializers.write import (
    ClassCreateUpdateSerializer,
    SubjectCreateUpdateSerializer,
)
from .models import Class, Subject, TeacherClass


def parse_bool_param(value, field_name):
    if value is None:
        return None
    normalized = value.lower()
    if normalized not in ["true", "false"]:
        raise ValidationError({field_name: "Use true or false."})
    return normalized == "true"

class SubjectViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_serializer_class(self):
        if self.action in ["create", "partial_update"]:
            return SubjectCreateUpdateSerializer
        if self.action == "retrieve":
            return SubjectDetailSerializer
        return SubjectListSerializer

    def get_queryset(self):
        queryset = (
            Subject.objects.select_related("academy")
            .annotate(class_count=Count("classes"))
            .all()
        )

        user = self.request.user
        if not user.is_superuser:
            if not user.academy_id:
                return queryset.none()
            queryset = queryset.filter(academy=user.academy)

        is_active = parse_bool_param(
            self.request.query_params.get("is_active"),
            "is_active",
        )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)

        return queryset

    def perform_create(self, serializer):
        academy = self.request.user.academy
        if academy is None:
            raise ValidationError({
                "academy": "Authenticated user is not linked to an academy."
            })
        serializer.save(academy=academy)

    def destroy(self, request, *args, **kwargs):
        subject = self.get_object()

        if subject.classes.filter(is_active=True).exists():
            return Response(
                {"detail": "Cannot deactivate subject with active classes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subject.is_active = False
        subject.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClassViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "subject__name"]

    def get_serializer_class(self):
        if self.action in ["create", "partial_update"]:
            return ClassCreateUpdateSerializer
        if self.action == "retrieve":
            return ClassDetailSerializer
        return ClassListSerializer

    def get_queryset(self):
        queryset = (
            Class.objects.select_related("academy", "subject")
            .prefetch_related(
                Prefetch(
                    "teacher_class",
                    queryset=TeacherClass.objects.select_related(
                        "teacher__user_id"
                    ),
                )
            )
            .annotate(
                enrolled_count=Count(
                    "enrollments",
                    filter=Q(enrollments__status="active"),
                    distinct=True,
                ),
                sessions_completed=Count("sessions", distinct=True),
            )
            .all()
        )

        user = self.request.user
        if not user.is_superuser:
            if not user.academy_id:
                return queryset.none()
            queryset = queryset.filter(academy=user.academy)

        subject_id = self.request.query_params.get("subject_id")
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        is_active = parse_bool_param(
            self.request.query_params.get("is_active"),
            "is_active",
        )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)

        teacher_id = self.request.query_params.get("teacher_id")
        if teacher_id:
            queryset = queryset.filter(
                teacher_class__teacher_id=teacher_id
            ).distinct()

        return queryset

    def perform_create(self, serializer):
        academy = self.request.user.academy
        if academy is None:
            raise ValidationError({
                "academy": "Authenticated user is not linked to an academy."
            })
        serializer.save(academy=academy)

    def destroy(self, request, *args, **kwargs):
        class_obj = self.get_object()

        if class_obj.enrollments.filter(status="active").exists():
            return Response(
                {"detail": "Cannot deactivate class with active enrollments."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        class_obj.is_active = False
        class_obj.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="students")
    def students(self, request, pk=None):
        class_obj = self.get_object()
        enrollments = (
            Enrollment.objects.filter(class_id=class_obj)
            .select_related("student_id__user")
            .order_by("student_id__user__full_name")
        )
        serializer = ClassStudentSerializer(enrollments, many=True)
        return Response(serializer.data)
