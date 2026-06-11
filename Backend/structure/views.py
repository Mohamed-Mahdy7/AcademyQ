from django.db.models import Count, Q, Avg, Case, When, FloatField
from django.utils import timezone
from datetime import timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

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
                sessions_count=Count("session_links", distinct=True),
                sessions_this_week=Count(
                    "session_links",
                    filter=Q(
                        session_links__session__session_date__range=(week_start, week_end)
                    ),
                    distinct=True,
                ),
                avg_attendance=Avg(
                    Case(
                        When(
                            session_links__session__attendance_records__present=True,
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

    @action(detail=True, methods=['post'], url_path='assign_teacher')
    def assign_teacher(self, request, pk=None):
        class_obj = self.get_object()
        teacher_id = request.data.get('teacher_id')

        if not teacher_id:
            return Response(
                {'detail': 'teacher_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            teacher = Teachers.objects.get(
                id=teacher_id,
                academy_id=request.user.academy_id
            )
        except Teachers.DoesNotExist:
            return Response(
                {'detail': 'Teacher not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if TeacherClass.objects.filter(
            assigned_class=class_obj,
            teacher=teacher
        ).exists():
            return Response(
                {'detail': 'Teacher is already assigned to this class.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        TeacherClass.objects.create(
            assigned_class=class_obj,
            teacher=teacher,
            assigned_at=request.data.get('assigned_at', class_obj.start_date)
        )

        return Response(
            {'detail': 'Teacher assigned successfully.'},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'], url_path='remove_teacher')
    def remove_teacher(self, request, pk=None):
        class_obj = self.get_object()
        teacher_id = request.data.get('teacher_id')

        if not teacher_id:
            return Response(
                {'detail': 'teacher_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            assignment = TeacherClass.objects.get(
                assigned_class=class_obj,
                teacher__id=teacher_id
            )
        except TeacherClass.DoesNotExist:
            return Response(
                {'detail': 'Teacher assignment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        assignment.delete()

        return Response(
            {'detail': 'Teacher removed successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


class ClassScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ClassScheduleSerializer

    def get_queryset(self):
        queryset = ClassSchedule.objects.filter(
            class_obj__academy=self.request.user.academy
        )
        class_id = self.request.query_params.get("class_id")
        if class_id:
            queryset = queryset.filter(class_obj__id=class_id)
        return queryset.order_by("day_of_week", "start_time")

    def perform_create(self, serializer):
        class_id = self.kwargs.get("class_pk") or self.request.data.get("class_obj")
        class_obj = Class.objects.get(
            id=class_id,
            academy=self.request.user.academy
        )
        serializer.save(class_obj=class_obj)


class ClassSessionEnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ClassSessionEnrollmentSerializer

    def get_queryset(self):
        queryset = ClassSessionEnrollment.objects.select_related(
            "session", "class_obj"
        ).filter(
            class_obj__academy=self.request.user.academy
        )
        class_id = self.request.query_params.get("class_id")
        if class_id:
            queryset = queryset.filter(class_obj__id=class_id)
        return queryset.order_by("class_obj", "session_num")