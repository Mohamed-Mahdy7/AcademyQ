from django.db import models
from core.models import Academy
from ai.agent.models import Alert  

class Notification(models.Model):
    CHANNEL_CHOICES = [("email", "Email")]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    ]

    academy = models.ForeignKey(Academy, on_delete=models.CASCADE, related_name="notifications", null=True)
    alert = models.ForeignKey(
        Alert,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    recipient_name = models.CharField(max_length=255)
    recipient_email = models.EmailField()
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default="email")
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient_name} — {self.channel} — {self.status}"