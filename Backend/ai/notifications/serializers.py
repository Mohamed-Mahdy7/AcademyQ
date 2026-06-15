from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student.full_name', read_only=True
    )
    student_phone = serializers.CharField(
        source='student.phone', read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            'id',
            'student',
            'student_name',
            'student_phone',
            'enrollment',
            'channel',
            'notification_type',
            'message',
            'status',
            'sent_at',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'sent_at']