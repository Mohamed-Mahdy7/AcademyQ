import uuid
from django.db import models
from financial_operations.models import Enrollment
from records.models import SubjectSession


class Grade(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='grades')

    session = models.ForeignKey(SubjectSession, on_delete=models.SET_NULL, related_name='grades', null=True)

    subject_name = models.CharField(max_length=255)

    score = models.DecimalField(max_digits=5, decimal_places=2)

    max_score = models.DecimalField(max_digits=5, decimal_places=2)

    assigned_at = models.DateField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['enrollment', 'session', 'subject_name'], name='unique_grade_per_enrollment_session')
        ]
    def __str__(self):
        return f"Grade {self.score}/{self.max_score} for enrollment {self.enrollment}"
