from django.db import models
from ai.agent.models import Alert
import uuid  

class Notification(models.Model):
    CHANNEL_CHOICES = [("email", "Email")]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    ]
    TYPE_CHOICES = [
        ('payment_reminder', 'Payment Reminder'),
        ('retention_alert', 'Retention Alert'),
        ('attendance_alert', 'Attendance Alert'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    student = models.ForeignKey(
        'core.Students',
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    enrollment = models.ForeignKey(
        'financial_operations.Enrollment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
    )
    alert = models.ForeignKey(
        Alert,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
    )
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default="email")
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.notification_type} → {self.student} via {self.channel} [{self.status}]"