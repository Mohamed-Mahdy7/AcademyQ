"""
Per-enrollment grade signal helpers for the risk scoring pipeline.
"""

from grades.models import Grade


def get_avg_score_last_2(enrollment_id) -> float | None:
    """
    Average percentage across the last 2 Grade rows for this enrollment,
    ordered by assigned_at descending.

    Returns None if fewer than 2 grades exist — a single grade or no
    grades isn't enough to assess a trend.
    """
    grades = (
        Grade.objects
        .filter(enrollment_id=enrollment_id)
        .order_by("-assigned_at")[:2]
    )

    grades = list(grades)

    if len(grades) < 2:
        return None

    percentages = [
        float(g.score / g.max_score) * 100
        if g.max_score else 0
        for g in grades
    ]

    return round(sum(percentages) / len(percentages), 2)