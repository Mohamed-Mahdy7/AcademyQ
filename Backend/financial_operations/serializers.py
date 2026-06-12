from rest_framework import serializers
from .models import Teachers, Enrollment, Payment
from django.db import models as django_models
from django.contrib.auth import get_user_model

User = get_user_model()
class TeachersSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user_id.full_name', read_only=True)
    email = serializers.EmailField(source='user_id.email', read_only=True)
    phone = serializers.CharField(source='user_id.phone', read_only=True)
    class Meta:
        model = Teachers
        fields = [
            'id',
            'academy_id',
            'user_id',
            'name',          
            'email',         
            'phone',
        ]

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='enrollment_id.student_id.full_name', read_only=True
    )
    class_name = serializers.CharField(
        source='enrollment_id.class_id.name', read_only=True
    )
    class Meta:
        model = Payment
        fields = [
            'id',
            'enrollment_id',
            'student_name', 
            'class_name', 
            'paid_on',
            'notes',
            'status',
            'due_date',
        ]

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student_id.full_name', read_only=True
    )    
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    class Meta:
        model = Enrollment
        fields = [
            'id',
            'class_id',
            'class_name',
            'student_id',
            'student_name',
              'start_date',
            'status', 
            'payments',       
        ]

    # def get_total_paid(self, obj):
    #     total = obj.payments.aggregate(
    #         total=django_models.Sum('amount')
    #     )['total']
    #     return str(total) if total else '0.00'

    # def get_balance_due(self, obj):
    #     total_paid = obj.payments.aggregate(
    #         total=django_models.Sum('amount')
    #     )['total'] or 0
    #     due = obj.fee_amount - total_paid
    #     return str(due)
