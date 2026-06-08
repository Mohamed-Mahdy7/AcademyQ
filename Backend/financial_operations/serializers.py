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
            'rate_per_session',
            'session_duration',
        ]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id',
            'enrollment_id',
            'amount',
            'paid_on',
            'notes',
        ]

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student_id.full_name', read_only=True
    )    
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    total_paid = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()
    payments = PaymentSerializer(many=True, read_only=True)
    class Meta:
        model = Enrollment
        fields = [
            'id',
            'class_id',
            'class_name',
            'student_id',
            'student_name',
            'fee_amount',
            'payment_cycle',
            'start_date',
            'end_date',
            'status',
            'total_paid',     
            'balance_due',    
            'payments',       
        ]

    def get_total_paid(self, obj):
        total = obj.payments.aggregate(
            total=django_models.Sum('amount')
        )['total']
        return str(total) if total else '0.00'

    def get_balance_due(self, obj):
        total_paid = obj.payments.aggregate(
            total=django_models.Sum('amount')
        )['total'] or 0
        due = obj.fee_amount - total_paid
        return str(due)
