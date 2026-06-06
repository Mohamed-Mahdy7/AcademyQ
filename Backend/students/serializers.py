from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Students

User = get_user_model()

class StudentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Students