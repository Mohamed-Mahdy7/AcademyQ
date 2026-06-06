from rest_framework import serializers

from financial_operations.models import Enrollment
from structure.models import Class, Subject


class SubjectDetailSerializer(serializers.ModelSerializer):
    class_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subject
        fields = (
            "id",
            "name",
            "description",
            "session_count",
            "is_active",
            "class_count",
        )


class ClassDetailSerializer(serializers.ModelSerializer):
    subject_id = serializers.UUIDField(source="subject.id", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    enrolled_count = serializers.IntegerField(read_only=True)
    sessions_completed = serializers.IntegerField(read_only=True)
    session_count = serializers.IntegerField(source="subject.session_count", read_only=True)
    teachers = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = (
            "id",
            "name",
            "subject_id",
            "subject_name",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
            "enrolled_count",
            "sessions_completed",
            "session_count",
            "teachers",
        )

    def get_teachers(self, obj):
        return [
            {
                "teacher_id": assignment.teacher_id,
                "name": assignment.teacher.user_id.full_name,
                "assigned_at": assignment.assigned_at,
            }
            for assignment in obj.teacher_class.all()
        ]


class ClassStudentSerializer(serializers.ModelSerializer):
    enrollment_id = serializers.UUIDField(source="id", read_only=True)
    student_id = serializers.UUIDField(source="student_id.id", read_only=True)
    student_name = serializers.CharField(source="student_id.user.full_name", read_only=True)
    enrollment_status = serializers.CharField(source="status", read_only=True)

    class Meta:
        model = Enrollment
        fields = (
            "enrollment_id",
            "student_id",
            "student_name",
            "enrollment_status",
            "fee_amount",
            "payment_cycle",
        )
