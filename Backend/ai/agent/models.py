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
    last_scanned_at = models.DateTimeField(auto_now=True)
    is_sent = models.BooleanField(default=False)

    class Meta:
        db_table = "alerts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Alert({self.enrollment_id}, {self.risk_level}, {self.risk_score})"
    
class ScanLog(models.Model):
    STATUS_PENDING = "pending"
    STATUS_RUNNING = "running"
    STATUS_COMPLETE = "complete"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETE, "Complete"),
        (STATUS_FAILED, "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academy = models.ForeignKey(
        "core.Academy",
        on_delete=models.CASCADE,
        related_name="scan_logs",
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    triggered_by = models.CharField(
        max_length=10,
        choices=[("manual", "Manual"), ("scheduled", "Scheduled")],
        default="manual",
    )
    students_scanned = models.PositiveIntegerField(default=0)
    alerts_created = models.PositiveIntegerField(default=0)
    alerts_updated = models.PositiveIntegerField(default=0)
    errors = models.PositiveIntegerField(default=0)
    error_log = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "scan_logs"
        ordering = ["-started_at"]

    def __str__(self):
        return f"ScanLog({self.academy_id}, {self.status}, {self.started_at})"