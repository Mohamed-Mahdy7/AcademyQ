"""
Per-enrollment attendance signal helpers for the AI risk scoring pipeline.
"""

from datetime import date, timedelta
from records.models import Attendance


def get_attendance_pct_28d(enrollment_id) -> float | None:
    """
    Returns attendance percentage for this enrollment over the last 28 days,
    based on session_date of each attended session.

    Returns None if no sessions exist in the window — no data is not the
    same as 0% attendance, so we treat it as a safe default (rule not triggered).
    """
    cutoff = date.today() - timedelta(days=28)

    records = Attendance.objects.filter(
        enrollment_id=enrollment_id,
        session__session_date__gte=cutoff,
    )

    total = records.count()

    if total == 0:
        return None

    present = records.filter(present=True).count()

    return round((present / total) * 100, 2)