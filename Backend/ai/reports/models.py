import uuid
from django.db import models


class AIReportCard(models.Model):
    RISK_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'core.Students',
        on_delete=models.CASCADE,
        related_name='report_cards',
    )
    enrollment = models.ForeignKey(
        'financial_operations.Enrollment',
        on_delete=models.CASCADE,
        related_name='report_cards',
    )
    month = models.CharField(max_length=7)  # "YYYY-MM"
    summary_text = models.TextField()
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES)
    risk_score = models.IntegerField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_report_cards"
        verbose_name = "AI Report Card"
        verbose_name_plural = "AI Report Cards"
        unique_together = [('enrollment', 'month')]
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.student.full_name} — {self.month} ({self.risk_level})"