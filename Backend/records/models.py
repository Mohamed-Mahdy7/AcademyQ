import uuid
from django.db import models


class SubjectSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey('structure.Class', on_delete=models.CASCADE, related_name='sessions')
    
    session_num = models.PositiveIntegerField()
    session_date = models.DateField()
    notes = models.TextField(blank=True, default='')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['class_obj', 'session_date'],
                name='unique_session_per_class_per_day'
            )
        ]
        ordering = ['session_num']

    def __str__(self):
        return f"Session {self.session_num} - {self.session_date}"


class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(SubjectSession, on_delete=models.CASCADE, related_name='attendance_records')

    enrollment = models.ForeignKey('financial_operations.Enrollment', on_delete=models.CASCADE, related_name='attendance_records')
    present = models.BooleanField(default=False)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['session', 'enrollment'],
                name='unique_attendance_per_enrollment_per_session'
            )
        ]

    def __str__(self):
        return f"{self.enrollment} - {'Present' if self.present else 'Absent'}"