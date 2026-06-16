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

    # --- overdue_days (financial_operations / Mahdy) ---
    # TODO: wire once Mahdy adds overdue_days to get_student_context,
    # or query Payment directly here if that's the agreed approach.
    #
    # try:
    #     from financial_operations.signals import get_overdue_days
    #     context["overdue_days"] = get_overdue_days(enrollment_id)
    # except Exception:
    #     pass

    return context