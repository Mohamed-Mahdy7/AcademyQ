"""
Assembles the context dict that risk_scorer() expects, for a single enrollment.
"""

from ai.agent.helpers.grade_signal import get_avg_score_last_2
from records.helpers.attendance_signals import get_attendance_pct_28d

def build_risk_context(enrollment_id) -> dict:
    """
    Gathers the three signals risk_scorer() needs for one enrollment:
        - attendance_pct_28d  (records app)
        - overdue_days        (financial_operations / Mahdy's get_student_context)
        - avg_score_last_2    (grades app, via get_avg_score_last_2)

    Any signal that fails to resolve is left as None — risk_scorer()
    treats None as "rule not triggered" (safe default).
    """
    context = {
        "attendance_pct_28d": None,
        "overdue_days": None,
        "avg_score_last_2": None,
    }

    # --- avg_score_last_2 (this app) ---
    try:
        context["avg_score_last_2"] = get_avg_score_last_2(enrollment_id)
    except Exception:
        pass  # leave as None — missing data = safe default

    # --- attendance_pct_28d (records app) ---
    try:
        context["attendance_pct_28d"] = get_attendance_pct_28d(enrollment_id)
    except Exception:
        pass

    try:
        from ai.utils.rag_engine import get_student_context
        from financial_operations.models import Enrollment

        enrollment = Enrollment.objects.select_related('student_id').get(id=enrollment_id)
        student_context = get_student_context(enrollment.student_id.id)

        payments = student_context.get("payments", [])
        enrollment_payment = next(
            (p for p in payments if p["enrollment_id"] == str(enrollment_id)),
            None
        )

        if enrollment_payment:
            overdue = enrollment_payment["overdue_days"]
            context["overdue_days"] = overdue if overdue > 0 else None

    except Exception:
        pass

    return context