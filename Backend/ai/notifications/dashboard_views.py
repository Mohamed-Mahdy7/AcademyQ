from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.exceptions import UpstreamError
from financial_operations.models import Enrollment
from records.helpers.attendance_signals import get_attendance_pct_28d


class AttendanceSummaryViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/dashboard/attendance-summary/
        Average attendance % across all active enrollments
        in the owner's academy, over the last 28 days.
        """
        enrollments = Enrollment.objects.filter(
            class_id__academy_id=request.user.academy_id,
            status='active',
        )

        rates = []
        for e in enrollments:
            try:
                pct = get_attendance_pct_28d(e.id)
            except Exception as exc:
                raise UpstreamError(
                    f"Attendance calculation failed for enrollment {e.id}."
                ) from exc

            if pct is not None:
                rates.append(pct)

        avg_rate = round(sum(rates) / len(rates), 1) if rates else None

        return Response({
            'attendance_pct_28d': avg_rate,
            'enrollments_counted': len(rates),
            'total_active_enrollments': enrollments.count(),
        })