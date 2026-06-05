from django.db import models
import uuid
from core.models import Academy, User
# Create your models here.

class Student(models.Model):
    class Status(models.TextChoices):
        ACTIVE="O", "Active"
        PENDING="A", "Pending"
        CANCELED='T', "Canceled"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    academy = models.ForeignKey(
        Academy,
        on_delete=models.CASCADE, 
        related_name="academy_student",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_student',
        null=False
    )
    patent_phone = models.CharField(max_length=15)
    educational_level = models.IntegerField(null=False)
    status = models.CharField(max_length=1, choices=Status.choices, null=False)
    enrolled_at = models.DateTimeField(auto_now_add=True),
    update_at = models.DateTimeField(auto_now=True)