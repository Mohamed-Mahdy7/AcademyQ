import uuid
from django.db import models


class Alert(models.Model):
    RISK_LOW = "low"
    RISK_MEDIUM = "medium"
    RISK_HIGH = "high"

    RISK_LEVEL_CHOICES = [
        (RISK_LOW, "Low"),
        (RISK_MEDIUM, "Medium"),
        (RISK_HIGH, "High"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(
        "financial_operations.Enrollment",
        on_delete=models.CASCADE,
        related_name="alerts",
    )
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES)
    risk_score = models.PositiveSmallIntegerField()
    primary_reason = models.TextField()
    recommended_action = models.TextField()
    message = models.TextField(blank=True, default="")  # LLM-generated, filled by AQ-065
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "alerts"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "created_at"],
                name="unique_alert_per_enrollment_per_scan_run",
            )
        ]

    def __str__(self):
        return f"Alert({self.enrollment_id}, {self.risk_level}, {self.risk_score})"