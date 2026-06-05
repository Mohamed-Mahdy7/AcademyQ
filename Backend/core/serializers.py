from django.db import transaction
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 
from rest_framework import serializers
from .models import Academy, User

User=get_user_model()

class AcademyRegistrationSerializer(serializers.Serializer):
    academy_name = serializers.CharField(max_length=100)
    academy_email = serializers.EmailField()
    academy_phone = serializers.CharField(max_length=15)
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
            phone=validated_data["academy_phone"]
        )

        owner = User.objects.create_user(
            academy=academy,
            full_name=validated_data["full_name"],
            email=validated_data["email"],
            phone=validated_data["phone"],
            password=validated_data["password"],
            role=User.Roles.OWNER
        )
        return owner


class UserSerializer(serializers.ModelSerializer):
    academy_name = serializers.CharField(
        source="academy.name", 
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
            "is_active",
            "academy_name",
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
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update({
            "id": self.user.id,
            "name": self.user.full_name,
            "email": self.user.email,
            "phone": self.user.phone,
            "role": self.user.role,
            "academy_id": (
                self.user.academy.id
                if self.user.academy
                else None
            ),
            "academy_name": (
                self.user.academy.name
                if self.user.academy
                else None
            ),
        })
        return data