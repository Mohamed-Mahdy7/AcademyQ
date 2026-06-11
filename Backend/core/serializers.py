from datetime import timedelta
from django.db.models import Sum
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 
from rest_framework import serializers
from .models import Academy, User
from records.models import Attendance
from financial_operations.models import Enrollment, Payment

User=get_user_model()

class AcademyRegistrationSerializer(serializers.Serializer):
    academy_name = serializers.CharField(max_length=100)
    academy_email = serializers.EmailField()
    academy_phone = serializers.CharField(max_length=15)
    address = serializers.CharField(max_length=1000)
    full_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        if (attrs["password"] != attrs["confirm_password"]):
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
                })
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("confirm_password")
        academy = Academy.objects.create(
            name=validated_data["academy_name"],
            email=validated_data["academy_email"],
            phone=validated_data["academy_phone"],
            address=validated_data["address"],
            subscription_end=timezone.now().date() + timedelta(days=30)
        )

        owner = User.objects.create_user(
            academy=academy,
            full_name=validated_data["full_name"],
            email=validated_data["email"],
            phone=validated_data["phone"],
            educational_level=0,
            password=validated_data["password"],
            role=User.Roles.OWNER
        )
        return owner

class AcademySerializer(serializers.ModelSerializer):
    class Meta:
        model = Academy
        fields = ["id", "name", "email", "phone", "address", "subscription_end"]


class UserSerializer(serializers.ModelSerializer):
    academy_name = serializers.CharField(
        source="academy.name", 
        read_only=True
    )
    academy_id = serializers.CharField(
        source="academy.id", 
        read_only=True
    )
    role_display = serializers.CharField(
        source="get_role_display",
        read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "role",
            "role_display",
            "status",
            "status_display",
            "academy_id",
            "academy_name",
            "created_at"
        ]


class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None
        if user.check_password(password):
            return user
        
        return None

class CustomeTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['academy_id'] = (
            str(user.academy.id)
            if user.academy
            else None
        )
        token['setup_complete'] = (
            user.academy.setup_complete
            if user.academy
            else True
        )
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update({
            "id": self.user.id,
            "name": self.user.full_name,
            "email": self.user.email,
            "phone": self.user.phone,
            "role": self.user.role,
            "academy_id": self.user.academy.id if self.user.academy else None,
            "academy_name": self.user.academy.name if self.user.academy else None,
            "setup_complete": self.user.academy.setup_complete if self.user.academy else True,
        })
        return data


class StaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        style={'input_type': 'password'}
        )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
        )
    role = serializers.ChoiceField(
        choices=[
            (User.Roles.ADMIN, "Admin"),
            (User.Roles.TEACHER, "Teacher"),
            (User.Roles.STUDENT, "Student"),
        ]
    )

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "phone",
            "password",
            "confirm_password",
            "role"
        ]

    def validate(self, attrs):
        if (attrs["password"] != attrs["confirm_password"]):
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
                })
        return attrs

    def create(self, validated_data):
        academy = self.context["request"].user.academy
        validated_data.pop("confirm_password")
        
        return User.objects.create_user(
            academy=academy,
            **validated_data
        )


class StudentCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        style={'input_type': 'password'}
        )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
        )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )
    enrollments = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "phone", 'parent_phone', 'enrolled_at','educational_level', 
            "academy", "password", "confirm_password", "status", "status_display", "enrollments"
        ]
    
    def get_enrollments(self, obj):
        return obj.enrollments.count()
    
    def validate(self, attrs):
        if (attrs["password"] != attrs["confirm_password"]):
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
                })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop("confirm_password")
        
        return User.objects.create_user(
            **validated_data,
            role=User.Roles.STUDENT,
        )


class StudentProfileUpdateSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )
    enrollments = serializers.SerializerMethodField()
    attendance = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "phone", "parent_phone", 
            "educational_level", "enrolled_at", "status", "status_display", 
            "enrollments", "attendance", "total_paid", "created_at", "update_at"
        ]
    
    def get_enrollments(self, obj):
        return obj.enrollments.count()

    def get_attendance(self, obj):
        return Attendance.objects.filter(
            enrollment__student_id=obj,
            present=True
        ).count()
        
    def get_total_paid(self, obj):
        total = Payment.objects.filter(
            enrollment_id__student_id=obj,
            status="completed"
        ).aggregate(
            total=Sum("amount")
        )["total"]

        return total or 0