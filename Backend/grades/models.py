import uuid
from django.db import models


class Grade(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    enrollment_id = models.ForeignKey('enrollments.Enrollment', on_delete=models.CASCADE, related_name='grades')

    session = models.ForeignKey('subjects.Session', on_delete=models.SET_NULL, related_name='grades')

    subject_name = models.CharField(max_length=255)

    score = models.DecimalField(max_digits=5, decimal_places=2)

    max_score = models.DecimalField(max_digits=5, decimal_places=2)

    assigned_at = models.DateField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['Enrollment_id', 'session', 'subject_name'], name='unique_grade_per_enrollment_session')
        ]
    def __str__(self):
        return f"Grade {self.score}/{self.max_score} for enrollment {self.Enrollment_id}"
