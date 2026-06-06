from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Grade
from .serializers import GradeSerializer

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    def get_queryset(self):
        queryset = Grade.objects.all()

        enrollment_id = self.request.query_params.get(
            "enrollment_id"
        )

        if enrollment_id:
            queryset = queryset.filter(
                enrollment_id=enrollment_id
            )

        return queryset.order_by("-assigned_at")

    @action(detail=False, methods=["get"])
    def summary(self, request):
        enrollment_id = request.query_params.get(
            "enrollment_id"
        )

        if not enrollment_id:
            return Response(
                {
                    "detail":
                    "enrollment_id query param required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        grades = Grade.objects.filter(
            enrollment_id=enrollment_id
        ).order_by("-assigned_at")

        if not grades.exists():
            return Response({
                "assessment_count": 0,
                "average_pct": None,
                "latest_score_pct": None,
                "trend": None,
            })

        percentages = [
            (grade.score / grade.max_score) * 100
            if grade.max_score else 0
            for grade in grades
        ]

        assessment_count = grades.count()

        average_pct = round(
            sum(percentages) / len(percentages),
            2,
        )

        latest_score_pct = round(
            percentages[0],
            2,
        )

        trend = None

        if len(percentages) >= 6:
            last_three_avg = (
                sum(percentages[:3])
                / len(percentages[:3])
            )

            previous_three = percentages[3:6]

            if previous_three:
                previous_three_avg = (
                    sum(previous_three)
                    / len(previous_three)
                )

                if last_three_avg > previous_three_avg:
                    trend = "improving"

                elif last_three_avg < previous_three_avg:
                    trend = "declining"

                else:
                    trend = "stable"

        return Response({
            "assessment_count": assessment_count,
            "average_pct": average_pct,
            "latest_score_pct": latest_score_pct,
            "trend": trend,
        })
