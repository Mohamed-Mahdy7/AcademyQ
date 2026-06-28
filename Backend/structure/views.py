from django.db.models import Count, Q, Avg, Case, When, FloatField
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema_view, extend_schema
from core.mixins import AcademyScopedMixin
from financial_operations.models import Teachers
from .models import (
    Subject,
    Class,
    TeacherClass,
    ClassSchedule,
    ClassSessionEnrollment,
)
from .serializers import (
    SubjectListSerializer,
    SubjectDetailSerializer,
    SubjectCreateSerializer,
    SubjectUpdateSerializer,
    ClassListSerializer,
    ClassDetailSerializer,
    ClassCreateSerializer,
    ClassUpdateSerializer,
    ClassScheduleSerializer,
    ClassSessionEnrollmentSerializer,
)

@extend_schema_view(
    list=extend_schema(tags=["Subject"]),
    retrieve=extend_schema(tags=["Subject"]),
    create=extend_schema(tags=["Subject"]),
    update=extend_schema(tags=["Subject"]),
    partial_update=extend_schema(tags=["Subject"]),
    destroy=extend_schema(tags=["Subject"]),
    
)
class SubjectViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Subject.objects.none()
        return (
            Subject.objects.select_related("academy")
            .prefetch_related("classes")
            .filter(academy=self.request.user.academy)
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

@extend_schema_view(
    list=extend_schema(tags=["Classes"]),
    retrieve=extend_schema(tags=["Classes"]),
    create=extend_schema(tags=["Classes"]),
    update=extend_schema(tags=["Classes"]),
    partial_update=extend_schema(tags=["Classes"]),
    destroy=extend_schema(tags=["Classes"]),
    assign_teacher=extend_schema(tags=["Teacher"]),
    remove_teacher=extend_schema(tags=["Teacher"]),
)
class ClassViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Class.objects.none()

        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        return (
            Class.objects.select_related("academy", "subject")
            .prefetch_related("teacher_assignments__teacher__user_id", "schedules")
            .filter(academy=self.request.user.academy)
            .annotate(
                students_count=Count("enrollments", distinct=True),
                sessions_count=Count("session_links", distinct=True),
                sessions_this_week=Count(
                    "session_links",
                    filter=Q(
                        session_links__session__session_date__range=(
                            week_start,
                            week_end,
                        )
                    ),
                    distinct=True,
                ),
                avg_attendance=Avg(
                    Case(
                        When(
                            session_links__session__attendance_records__present=True,
                            then=100.0,
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

    @action(detail=True, methods=["post"], url_path="assign_teacher")
    def assign_teacher(self, request, pk=None):
        class_obj = self.get_object()
        teacher_id = request.data.get("teacher_id")

        if not teacher_id:
            raise ValidationError("teacher_id is required.")

        try:
            teacher = Teachers.objects.get(
                id=teacher_id, academy_id=request.user.academy_id
            )
        except Teachers.DoesNotExist:
            raise ValidationError("Teacher not found.")

        if TeacherClass.objects.filter(
            assigned_class=class_obj, teacher=teacher
        ).exists():
            return Response(
                {"detail": "Teacher is already assigned to this class."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        TeacherClass.objects.create(
            assigned_class=class_obj,
            teacher=teacher,
            assigned_at=request.data.get("assigned_at", class_obj.start_date),
        )

        return Response(
            {"detail": "Teacher assigned successfully."}, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["delete"], url_path="remove_teacher")
    def remove_teacher(self, request, pk=None):
        class_obj = self.get_object()
        teacher_id = request.data.get("teacher_id")

        if not teacher_id:
            raise ValidationError("teacher_id is required.")

        try:
            assignment = TeacherClass.objects.get(
                assigned_class=class_obj, teacher__id=teacher_id
            )
        except TeacherClass.DoesNotExist:
            raise ValidationError("Teacher assignment not found.")

        assignment.delete()

        return Response(
            {"detail": "Teacher removed successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


@extend_schema_view(
    list=extend_schema(tags=["Class Schedule"]),
    retrieve=extend_schema(tags=["Class Schedule"]),
    create=extend_schema(tags=["Class Schedule"]),
    update=extend_schema(tags=["Class Schedule"]),
    partial_update=extend_schema(tags=["Class Schedule"]),
    destroy=extend_schema(tags=["Class Schedule"]),
)
class ClassScheduleViewSet(AcademyScopedMixin, viewsets.ModelViewSet):
    serializer_class = ClassScheduleSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ClassSchedule.objects.none()
        
        queryset = ClassSchedule.objects.select_related("class_obj").filter(
            class_obj__academy=self.request.user.academy
        )
        class_id = self.request.query_params.get("class_id")
        if class_id:
            queryset = queryset.filter(class_obj__id=class_id)
        return queryset.order_by("day_of_week", "start_time")

    def perform_create(self, serializer):
        class_id = self.request.data.get("class_obj")
        class_obj = Class.objects.get(id=class_id, academy=self.request.user.academy)
        serializer.save(class_obj=class_obj)

@extend_schema_view(
    list=extend_schema(tags=["Structure"]),
    retrieve=extend_schema(tags=["Structure"]),
)
class ClassSessionEnrollmentViewSet(AcademyScopedMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ClassSessionEnrollmentSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ClassSessionEnrollment.objects.none()
        
        queryset = ClassSessionEnrollment.objects.select_related(
            "session", "class_obj"
        ).filter(class_obj__academy=self.request.user.academy)
        class_id = self.request.query_params.get("class_id")
        if class_id:
            queryset = queryset.filter(class_obj__id=class_id)
        return queryset.order_by("class_obj", "session_num")
