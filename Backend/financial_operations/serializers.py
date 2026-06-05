from rest_framework import serializers
from .models import Teachers, Enrollment, Payment

class TeachersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teachers
        fields = [
            'id',
            'academy_id',
            'user_id',
            'rate_per_session',
            'session_duration',
        ]

class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = [
            'id',
            'class_id',
            'student_id',
            'fee_amount',
            'payment_cycle',
            'start_date',
            'end_date',
            'status',
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