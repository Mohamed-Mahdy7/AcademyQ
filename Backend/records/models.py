import uuid
from django.db import models


class ClassSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_date = models.DateField()
    session_time = models.TimeField()
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'class_sessions'
        constraints = [
            models.UniqueConstraint(
                fields=['session_date', 'session_time'],
                name='unique_event_datetime'
            )
        ]
        ordering = ['session_date', 'session_time']

    def __str__(self):
        return f"Session {self.session_date} {self.session_time}"


class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ClassSession,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    enrollment = models.ForeignKey(
        'financial_operations.Enrollment',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    present = models.BooleanField(default=False)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance'
        constraints = [
            models.UniqueConstraint(
                fields=['session', 'enrollment'],
                name='unique_attendance_per_enrollment_per_session'
            )
        ]

    def __str__(self):
        return f"{self.enrollment} - {'Present' if self.present else 'Absent'}"