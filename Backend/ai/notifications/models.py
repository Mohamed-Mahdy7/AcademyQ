from django.db import models
import uuid


class Notification(models.Model):

    CHANNEL_CHOICES = [
        ('sms', 'SMS'),
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]

    TYPE_CHOICES = [
        ('payment_reminder', 'Payment Reminder'),
        ('retention_alert', 'Retention Alert'),
        ('attendance_alert', 'Attendance Alert'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        db_column='student_id',
        related_name='notifications',
        limit_choices_to={'role': 'S'}
    )
    enrollment = models.ForeignKey(
        'financial_operations.Enrollment',
        on_delete=models.CASCADE,
        db_column='enrollment_id',
        related_name='notifications',
        null=True,
        blank=True
    )

    # What kind of notification and how it was sent
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='sms')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # The AI-generated message body
    message = models.TextField()

    # Who receives it — parent phone pulled from student at send time
    recipient_phone = models.CharField(max_length=20, blank=True, null=True)
    recipient_email = models.EmailField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notification'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification {self.id} — {self.notification_type} → {self.student} via {self.channel}"