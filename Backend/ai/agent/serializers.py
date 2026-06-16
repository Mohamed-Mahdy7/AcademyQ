from rest_framework import serializers
from .models import Alert, ScanLog


class AlertSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="enrollment.student_id.full_name", read_only=True
    )
    class_name = serializers.CharField(
        source="enrollment.class_id.name", read_only=True
    )

    class Meta:
        model = Alert
        fields = [
            "id",
            "enrollment",
            "student_name",
            "class_name",
            "risk_level",
            "risk_score",
            "primary_reason",
            "recommended_action",
            "message",
            "created_at",
            "last_scanned_at",
            "reviewed_at",
            "notes",
        ]
        read_only_fields = [
            "id",
            "enrollment",
            "student_name",
            "class_name",
            "risk_level",
            "risk_score",
            "primary_reason",
            "recommended_action",
            "message",
            "created_at",
            "last_scanned_at",
        ]

from .models import Alert, ScanLog

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