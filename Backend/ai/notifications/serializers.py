from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "alert",
            "recipient_name",
            "recipient_email",
            "channel",
            "message",
            "status",
            "sent_at",
            "created_at",
        ]
        read_only_fields = ["id", "status", "sent_at", "created_at"]


class SendNotificationSerializer(serializers.Serializer):
    alert_id = serializers.IntegerField(required=False, allow_null=True)
    recipient_name = serializers.CharField(max_length=255)
    recipient_email = serializers.EmailField()
    message = serializers.CharField()