from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from core.mixins import AcademyScopedMixin
from structure.models import Class
from financial_operations.models import Enrollment
from .models import AIReportCard
from .serializers import (
    AIReportCardSerializer,
    GenerateReportSerializer,
    GenerateBulkReportSerializer,
)
from .generator import generate_report_card
from .tasks import generate_class_reports_task

@extend_schema_view(
    list=extend_schema(tags=["AI Reports"]),
    retrieve=extend_schema(tags=["AI Reports"]),
    destroy=extend_schema(tags=["AI Reports"]),
    generate=extend_schema(tags=["AI Reports"]),
    generate_bulk=extend_schema(tags=["AI Reports"]),
)
class AIReportCardViewSet(
    AcademyScopedMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AIReportCardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return AIReportCard.objects.none()
        
        qs = AIReportCard.objects.filter(
            enrollment__class_id__academy_id=self.request.user.academy_id
        ).select_related("student", "enrollment__class_id")
        student_id = self.request.query_params.get("student_id")
        enrollment_id = self.request.query_params.get("enrollment_id")
        class_id = self.request.query_params.get("class_id")
        month = self.request.query_params.get("month")
        if student_id:
            qs = qs.filter(student_id=student_id)
        if enrollment_id:
            qs = qs.filter(enrollment_id=enrollment_id)
        if class_id:
            qs = qs.filter(enrollment__class_id=class_id)
        if month:
            qs = qs.filter(month=month)
        return qs

    def perform_destroy(self, instance):
        if self.request.user.role not in ("O", "A"):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Only owners or admins can delete reports.")
        instance.delete()

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        if request.user.role not in ("O", "A"):
            return Response(
                {"detail": "Only owners or admins can generate reports."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = GenerateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enrollment_id = serializer.validated_data["enrollment_id"]
        month = serializer.validated_data["month"]
        try:
            enrollment = Enrollment.objects.get(
                id=enrollment_id,
                class_id__academy_id=request.user.academy_id,
            )
        except Enrollment.DoesNotExist:
            return Response(
                {"detail": "Enrollment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        report = generate_report_card(enrollment, month)
        return Response(
            AIReportCardSerializer(report).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="generate_bulk")
    def generate_bulk(self, request):
        if request.user.role not in ("O", "A"):
            return Response(
                {"detail": "Only owners or admins can generate reports."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GenerateBulkReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        class_id = serializer.validated_data["class_id"]
        month = serializer.validated_data["month"]

        try:
            class_obj = Class.objects.get(
                id=class_id, academy_id=request.user.academy_id
            )
        except Class.DoesNotExist:
            return Response(
                {"detail": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        active_count = Enrollment.objects.filter(
            class_id=class_obj, status="active"
        ).count()

        if active_count == 0:
            return Response(
                {"detail": "No active students enrolled in this class."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        generate_class_reports_task.delay(str(class_obj.id), month)

        return Response(
            {
                "detail": f"Queued report generation for {active_count} students.",
                "students_queued": active_count,
                "month": month,
            },
            status=status.HTTP_202_ACCEPTED,
        )
