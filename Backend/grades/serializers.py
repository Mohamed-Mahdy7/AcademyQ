from rest_framework import serializers
from .models import Grade


class GradeSerializer(serializers.ModelSerializer):
    session_num = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            "id",
            "enrollment",
            "session",
            "session_num",
            "subject_name",
            "score",
            "max_score",
            "assigned_at",
        ]
        read_only_fields = ["id"]

    def validate_max_score(self, value):
        if value <= 0:
            raise serializers.ValidationError("max_score must be greater than 0.")
        return value

    def validate(self, attrs):
        score = attrs.get("score")
        max_score = attrs.get("max_score")
        session = attrs.get("session")
        assigned_at = attrs.get("assigned_at")

        if score is not None and max_score is not None and score > max_score:
            raise serializers.ValidationError(
                {"score": "Score cannot be greater than max_score."}
            )

        if session and assigned_at and assigned_at < session.session_date:
            raise serializers.ValidationError(
                {"assigned_at": "Assigned date cannot be before the session date."}
            )
        
        return attrs

    def get_session_num(self, obj):
        if not obj.session_id:
            return None
        from structure.models import ClassSessionEnrollment
        junction = ClassSessionEnrollment.objects.filter(
            session_id=obj.session_id,
            class_obj=obj.enrollment.class_id
        ).first()
        return junction.session_num if junction else None