"""
Pure risk scoring function for the AI dropout-risk agent.

Rules:
- No database queries.
- No Django model imports.
- Receives a context dict, returns a result dict.
- All thresholds/weights are module-level constants for easy tuning.

Expected context keys (all optional — missing data uses safe defaults):
    attendance_pct_28d : float | None   -- attendance % over last 28 days
    overdue_days       : int   | None   -- days since the oldest pending payment became overdue
    avg_score_last_2   : float | None   -- average percentage score on last 2 assessments
    student_name       : str   | None   -- used only for primary_reason text
"""

# ---- Configurable scoring rules -------------------------------------------------

ATTENDANCE_THRESHOLD_PCT = 70
ATTENDANCE_PENALTY = 40

OVERDUE_THRESHOLD_DAYS = 14
OVERDUE_PENALTY = 35

LOW_SCORE_THRESHOLD = 50
LOW_SCORE_PENALTY = 25

# ---- Risk level bands -------------------------------------------------------------

RISK_LOW_MAX = 39      # 0-39   -> low
RISK_MEDIUM_MAX = 69   # 40-69  -> medium
# 70-100 -> high

MAX_SCORE = 100


def _check_attendance(context: dict) -> tuple[bool, int]:
    """Returns (triggered, points)."""
    attendance_pct = context.get("attendance_pct_28d")

    if attendance_pct is None:
        # Missing data = safe default = rule not triggered
        return False, 0

    if attendance_pct < ATTENDANCE_THRESHOLD_PCT:
        return True, ATTENDANCE_PENALTY

    return False, 0


def _check_overdue_fees(context: dict) -> tuple[bool, int]:
    """Returns (triggered, points)."""
    overdue_days = context.get("overdue_days")

    if overdue_days is None:
        return False, 0

    if overdue_days > OVERDUE_THRESHOLD_DAYS:
        return True, OVERDUE_PENALTY

    return False, 0


def _check_low_scores(context: dict) -> tuple[bool, int]:
    """Returns (triggered, points)."""
    avg_score = context.get("avg_score_last_2")

    if avg_score is None:
        return False, 0

    if avg_score < LOW_SCORE_THRESHOLD:
        return True, LOW_SCORE_PENALTY

    return False, 0


def _risk_level(score: int) -> str:
    if score <= RISK_LOW_MAX:
        return "low"
    if score <= RISK_MEDIUM_MAX:
        return "medium"
    return "high"


def _primary_reason(triggers: dict, context: dict) -> str:
    """
    Pick the single most significant triggered reason.
    Priority order: attendance > overdue fees > low scores.
    If nothing triggered, return a neutral message.
    """
    if triggers["attendance"][0]:
        pct = context.get("attendance_pct_28d")
        return f"Attendance dropped to {pct}% over the last 28 days."

    if triggers["overdue"][0]:
        days = context.get("overdue_days")
        return f"Payment overdue by {days} days."

    if triggers["low_scores"][0]:
        avg = context.get("avg_score_last_2")
        return f"Average score on recent assessments is {avg}%."

    return "No significant risk factors detected."


def _recommended_action(risk_level: str, triggers: dict) -> str:
    """
    Map triggered rules to a recommended action string.
    risk_level only affects the urgency prefix.
    """
    actions = []

    if triggers["attendance"][0]:
        actions.append("Contact parent/guardian regarding attendance")

    if triggers["overdue"][0]:
        actions.append("Send payment reminder")

    if triggers["low_scores"][0]:
        actions.append("Schedule academic check-in with teacher")

    if not actions:
        return "No action needed. Continue routine monitoring."

    if risk_level == "high":
        return "Urgent: " + "; ".join(actions) + "."

    return "; ".join(actions) + "."


def risk_scorer(context: dict) -> dict:
    """
    Compute dropout risk from a student context dict.

    Returns:
        {
            "risk_level": "low" | "medium" | "high",
            "risk_score": int (0-100),
            "primary_reason": str,
            "recommended_action": str,
        }
    """
    context = context or {}

    triggers = {
        "attendance": _check_attendance(context),
        "overdue": _check_overdue_fees(context),
        "low_scores": _check_low_scores(context),
    }

    raw_score = sum(points for _, points in triggers.values())
    risk_score = min(raw_score, MAX_SCORE)

    risk_level = _risk_level(risk_score)

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "primary_reason": _primary_reason(triggers, context),
        "recommended_action": _recommended_action(risk_level, triggers),
    }