from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from financial_operations.models import Enrollment
from .models import AIReportCard
from .serializers import AIReportCardSerializer, GenerateReportSerializer
from .generator import generate_report_card


class AIReportCardViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AIReportCardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AIReportCard.objects.filter(
            enrollment__class_id__academy_id=self.request.user.academy_id
        ).select_related("student", "enrollment__class_id")

        student_id = self.request.query_params.get("student_id")
        enrollment_id = self.request.query_params.get("enrollment_id")
        month = self.request.query_params.get("month")

        if student_id:
            qs = qs.filter(student_id=student_id)
        if enrollment_id:
            qs = qs.filter(enrollment_id=enrollment_id)
        if month:
            qs = qs.filter(month=month)

        return qs

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