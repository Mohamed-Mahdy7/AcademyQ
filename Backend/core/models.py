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
    is_active=models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    objects=UserManager()
    
    USERNAME_FIELD='email'
    REQUIRED_FIELDS=[]
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        ordering = ['full_name']
    
    def __str__(self):
        return self.full_name