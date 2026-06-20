from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import uuid
# Create your models here.

class Academy(models.Model):
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name=models.CharField(max_length=100, null=False)
    email=models.EmailField(unique=True)
    phone=models.CharField(max_length=15)
    address=models.TextField(blank=True)
    subscription_end=models.DateField(null=True)
    setup_complete=models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    weekly_report_enabled = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'academy'
        verbose_name = 'Academy'
        ordering = ['name']
        
    def has_active_subscription(self):
        return (
            self.subscription_end is not None
            and self.subscription_end >= timezone.now().date()
        )
    
    def __str__(self):
        return self.name

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address!")
        
        email=self.normalize_email(email)
        user=self.model(email=email, **extra_fields)
        
        user.set_password(password)
        user.save()
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        OWNER="O", "Owner"
        ADMIN="A", "Admin"
        TEACHER='T', "Teacher"
        STUDENT='S', "Student"
    
    class Status(models.TextChoices):
        ACTIVE="A", "Active"
        PENDING="P", "Pending"
        DROPPED='D', "Dropped"
    
    class EducationalLevel(models.IntegerChoices):
        PRIMARY_1 = 1, "Primary 1"
        PRIMARY_2 = 2, "Primary 2"
        PRIMARY_3 = 3, "Primary 3"
        PRIMARY_4 = 4, "Primary 4"
        PRIMARY_5 = 5, "Primary 5"
        PRIMARY_6 = 6, "Primary 6"
        PREP_1 = 7, "Preparatory 1"
        PREP_2 = 8, "Preparatory 2"
        PREP_3 = 9, "Preparatory 3"
        SEC_1 = 10, "Secondary 1"
        SEC_2 = 11, "Secondary 2"
        SEC_3 = 12, "Secondary 3"
        COLLEGE_1 = 13, "College 1"
        COLLEGE_2 = 14, "College 2"
        COLLEGE_3 = 15, "College 3"
        COLLEGE_4 = 16, "College 4"
        COLLEGE_5 = 17, "College 5"
        COLLEGE_6 = 18, "College 6"
    
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academy=models.ForeignKey(
        Academy,
        on_delete=models.CASCADE, 
        related_name="academy_user",
        null=True,
        blank=True,
        )
    full_name=models.CharField(max_length=100, null=False)
    email=models.EmailField(unique=True)
    phone=models.CharField(max_length=20)
    role=models.CharField(max_length=10, choices=Roles.choices, null=False)
    parent_email = models.EmailField(blank=True, default="")
    educational_level = models.IntegerField(
        choices=EducationalLevel.choices,
        null=True
        )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default="P",
        null=False)
    enrolled_at = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active=models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    objects=UserManager()
    
    USERNAME_FIELD='email'
    REQUIRED_FIELDS=["educational_level"]
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        ordering = ['full_name']
    
    def __str__(self):
        return self.full_name