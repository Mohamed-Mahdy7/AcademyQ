from django.db import models
from django.contrib.auth import get_user_model
from pgvector.django import VectorField
from core.models import Academy
import uuid


User = get_user_model()

class StudentEmbedding(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
        )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="embeddings"
    )
    embedding = VectorField(dimensions=3072)
    source_text = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Embedding({self.student.full_name})"


class AIUsageLog(models.Model):
    class Feature(models.TextChoices):
        REPORT_CARD = "report_card", "Report Card"
        RISK_SCORE = "risk_score", "Risk Score"
        PAYMENT_REMINDER = "payment_reminder", "Payment Reminder"
        MANAGEMENT_REPORT = "management_report", "Management Report"
        EMBEDDING = "embedding", "Embedding"
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    academy = models.ForeignKey(
        Academy,
        on_delete=models.CASCADE,
        related_name="ai_usage_logs"
    )
    feature = models.CharField(max_length=100, choices=Feature.choices)
    model = models.CharField(max_length=100)
    prompt_token = models.IntegerField(default=0)
    completion_token = models.IntegerField(default=0)
    total_cost_usd = models.DecimalField(
        max_digits=10, decimal_places=6
    )
    succeeded = models.BooleanField(default=True)
    called_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-called_at"]
        
    def __str__(self):
        return f"{self.feature} - ${self.total_cost_usd}"