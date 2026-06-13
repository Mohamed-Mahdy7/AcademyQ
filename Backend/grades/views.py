from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsOwner, ActiveSubscriptionRequired
from .models import Grade
from .serializers import GradeSerializer


class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    permission_classes = [IsOwner, ActiveSubscriptionRequired]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = Grade.objects.filter(
            enrollment__class_id__academy_id=self.request.user.academy_id
        )
        enrollment_ids = self.request.query_params.get("enrollment_ids")
        if enrollment_ids:
            ids = enrollment_ids.split(",")
            queryset = queryset.filter(enrollment_id__in=ids)
        return queryset.order_by("assigned_at")

    @action(detail=False, methods=["get"])
    def summary(self, request):
        enrollment_id = request.query_params.get("enrollment_id")
        if not enrollment_id:
            return Response(
                {"detail": "enrollment_id query param required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grades = self.get_queryset().filter(
            enrollment_id=enrollment_id
        ).order_by("assigned_at")

        if not grades.exists():
            return Response({
                "assessment_count": 0,
                "average_pct": None,
                "latest_score_pct": None,
                "trend": None,
            })

        percentages = [
            float(grade.score / grade.max_score) * 100
            if grade.max_score else 0
            for grade in grades
        ]

        assessment_count = len(percentages)
        average_pct = round(sum(percentages) / assessment_count, 2)
        latest_score_pct = round(percentages[-1], 2)

        trend = None
        if assessment_count >= 6:
            last_three_avg = sum(percentages[-3:]) / 3
            previous_three = percentages[-6:-3]
            previous_three_avg = sum(previous_three) / 3
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

    @action(detail=False, methods=["get"], url_path="class-summary")
    def class_summary(self, request):
        class_id = request.query_params.get("class_id")
        if not class_id:
            return Response(
                {"detail": "class_id query param required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollments = Grade.objects.filter(
            enrollment__class_id__id=class_id,
            enrollment__class_id__academy_id=request.user.academy_id,
        ).values_list('enrollment', flat=True).distinct()

        students = []
        for enrollment_id in enrollments:
            grades = Grade.objects.filter(
                enrollment_id=enrollment_id
            ).order_by("assigned_at")

            percentages = [
                float(g.score / g.max_score) * 100
                if g.max_score else 0
                for g in grades
            ]

            count = len(percentages)
            average = round(sum(percentages) / count, 2) if count else 0

            trend = None
            if count >= 6:
                last_three_avg = sum(percentages[-3:]) / 3
                previous_three = percentages[-6:-3]
                previous_three_avg = sum(previous_three) / 3
                if last_three_avg > previous_three_avg:
                    trend = "improving"
                elif last_three_avg < previous_three_avg:
                    trend = "declining"
                else:
                    trend = "stable"

            first_grade = grades.first()
            students.append({
                "student_id": str(first_grade.enrollment.student_id.id),
                "student_name": first_grade.enrollment.student_id.full_name,
                "average": average,
                "assessments": count,
                "trend": trend,
            })

        return Response({"students": students})