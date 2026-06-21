from rest_framework import serializers
from .models import Alert, ScanLog

class AlertSerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(
        source="enrollment.student_id.user_id", read_only=True
    )
    student_name = serializers.CharField(
        source="enrollment.student_id.user.full_name", read_only=True
    )
    parent_email = serializers.EmailField(
        source="enrollment.student_id.parent_email", read_only=True
    )
    class_name = serializers.CharField(
        source="enrollment.class_id.name", read_only=True
    )
    is_dismissed = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            "id",
            "enrollment",
            "student_id",
            "student_name",
            "class_name",
            "parent_email",
            "risk_level",
            "risk_score",
            "primary_reason",
            "recommended_action",
            "message",
            "is_dismissed",
            "is_sent",
            "created_at",
            "last_scanned_at",
            "reviewed_at",
            "notes",
        ]
        read_only_fields = [
            "id",
            "enrollment",
            "student_id",
            "student_name",
            "class_name",
            "parent_email",
            "risk_level",
            "risk_score",
            "primary_reason",
            "recommended_action",
            "message",
            "created_at",
            "last_scanned_at",
        ]

    def get_is_dismissed(self, obj):
        return obj.reviewed_at is not None
        

class ScanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanLog
        fields = [
            "id",
            "status",
            "triggered_by",
            "students_scanned",
            "alerts_created",
            "alerts_updated",
            "errors",
            "error_log",
            "started_at",
            "completed_at",
        ]
        read_only_fields = fields