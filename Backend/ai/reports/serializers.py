from rest_framework import serializers
from .models import AIReportCard


class AIReportCardSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    class_name = serializers.CharField(
        source="enrollment.class_id.name", read_only=True
    )

    class Meta:
        model = AIReportCard
        fields = [
            "id",
            "student",
            "student_name",
            "enrollment",
            "class_name",
            "month",
            "summary_text",
            "risk_level",
            "risk_score",
            "generated_at",
        ]
        read_only_fields = fields


class GenerateReportSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField()
    month = serializers.RegexField(regex=r"^\d{4}-(0[1-9]|1[0-2])$")


class GenerateBulkReportSerializer(serializers.Serializer):
    class_id = serializers.UUIDField()
    month = serializers.RegexField(regex=r"^\d{4}-(0[1-9]|1[0-2])$")
