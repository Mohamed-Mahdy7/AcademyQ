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

    def get_session_num(self, obj):
        if not obj.session_id:
            return None
        from structure.models import ClassSessionEnrollment
        junction = ClassSessionEnrollment.objects.filter(
            session_id=obj.session_id,
            class_obj=obj.enrollment.class_id
        ).first()
        return junction.session_num if junction else None