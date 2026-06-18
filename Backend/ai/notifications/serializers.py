from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student.full_name', read_only=True
    )
    student_email = serializers.CharField(
        source='student.email', read_only=True
    )
    parent_email = serializers.CharField(
        source='student.parent_email', read_only=True
    )
    alert_risk_level = serializers.CharField(
        source='alert.risk_level', read_only=True
    )
    alert_primary_reason = serializers.CharField(
        source='alert.primary_reason', read_only=True
    )
    class Meta:
        model = Notification
        fields = [
           'id',
            'student',
            'student_name',
            'student_email',
            'parent_email',
            'enrollment',
            'alert',
            'alert_risk_level',
            'alert_primary_reason',
            'channel',
            'notification_type',
            'message',
            'status',
            'sent_at',
            'created_at',
        ]
        read_only_fields = ["id", "created_at", "sent_at" ]