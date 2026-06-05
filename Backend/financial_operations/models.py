from django.db import models
import uuid
# Create your models here.


class Teachers(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academy_id = models.ForeignKey('academy.Academy', on_delete=models.CASCADE, db_column='academy_id', related_name='teachers')
    user_id = models.ForeignKey('users.Users', on_delete=models.CASCADE, db_column='user_id', related_name='teacher_profile')
    rate_per_session = models.DecimalField(max_digits=10, decimal_places=2)
    session_duration = models.TimeField()

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
    class_id = models.ForeignKey('classes.Classes',on_delete=models.CASCADE,db_column='class_id',related_name='enrollments')
    student_id = models.ForeignKey('students.Students',on_delete=models.CASCADE,db_column='student_id',related_name='enrollments')
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_cycle = models.DateField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
 
    class Meta:
        db_table = 'enrollment'
 
    def __str__(self):
        return f"Enrollment {self.id} — Student {self.student_id} in Class {self.class_id}"
    
class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment_id = models.ForeignKey('Enrollment', on_delete=models.CASCADE, db_column='enrollment_id', related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_on = models.DateField()
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'payment'

    def __str__(self):
        return f"Payment {self.id} — Enrollment {self.enrollment_id}"