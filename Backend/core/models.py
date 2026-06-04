from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import uuid
# Create your models here.

class Academy(models.Model):
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name=models.CharField(max_length=100, null=False)
    email=models.EmailField(unique=True)
    phone=models.CharField(max_length=15)
    created_at=models.DateTimeField(auto_now_add=True)

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
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        OWNER="O", "Owner"
        ADMIN="A", "Admin"
        TEACHER='T', "Teacher"
        STUDENT='S', "Studebt"
    
    id=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academy=models.ForeignKey(
        Academy,
        on_delete=models.CASCADE, 
        related_name="academy_user",
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
    
    def __str__(self):
        return self.email