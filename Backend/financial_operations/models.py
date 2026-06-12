from django.db import models
import uuid
from structure.models import Class

class Teachers(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academy_id = models.ForeignKey('core.Academy', on_delete=models.CASCADE, db_column='academy_id', related_name='teachers')
    user_id = models.OneToOneField('core.User', on_delete=models.CASCADE, db_column='user_id', related_name='teacher_profile')

    class Meta:
        db_table = 'teachers'

    def __str__(self):
        return f"Teacher {self.user_id} - Academy {self.academy_id}"


class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('dropped', 'Dropped'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_id = models.ForeignKey(Class, on_delete=models.PROTECT, db_column='class_id', related_name='enrollments')
    student_id = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        db_column='student_id',
        related_name='enrollments',
        limit_choices_to={'role': 'S'}
    )
    start_date = models.DateField(null=True, blank=True) 
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        db_table = 'enrollment'
        unique_together = [['student_id', 'class_id']]

    def __str__(self):
        return f"Enrollment {self.id} — Student {self.student_id} in Class {self.class_id}"


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('deleted', 'Deleted'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment_id = models.ForeignKey(Enrollment, on_delete=models.PROTECT, db_column='enrollment_id', related_name='payments')
    due_date = models.DateField(null=True, blank=True) 
    paid_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    amount = models.DecimalField(null = False, max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'payment'

    def __str__(self):
        return f"Payment {self.id} — Enrollment {self.enrollment_id}"