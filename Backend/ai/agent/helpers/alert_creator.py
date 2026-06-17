"""
Dedup-aware Alert creation/update for the weekly risk scan.
"""

from ai.agent.models import Alert


def create_alert_if_needed(enrollment_id, risk_result: dict) -> Alert:
    """
    If an unreviewed alert already exists for this enrollment, update it
    in place with the latest risk assessment only if risk_level has
    worsened or stayed the same severity (never downgrades an existing
    unreviewed alert based on a single re-scan — see note below).

    If no unreviewed alert exists, creates a new one.

    Returns the created or updated Alert.
    """
    severity = {"low": 0, "medium": 1, "high": 2}

    existing = Alert.objects.filter(
        enrollment_id=enrollment_id,
        reviewed_at__isnull=True,
    ).first()

    if existing is None:
        alert = Alert.objects.create(
            enrollment_id=enrollment_id,
            risk_level=risk_result["risk_level"],
            risk_score=risk_result["risk_score"],
            primary_reason=risk_result["primary_reason"],
            recommended_action=risk_result["recommended_action"],
        )
        return alert, "created"
    
    if severity[risk_result["risk_level"]] >= severity[existing.risk_level]:
        existing.risk_level = risk_result["risk_level"]
        existing.risk_score = risk_result["risk_score"]
        existing.primary_reason = risk_result["primary_reason"]
        existing.recommended_action = risk_result["recommended_action"]
        existing.save()
        return existing, "updated"

    return existing, "skipped"