from rest_framework import serializers

from structure.models import Class, Subject


class SubjectCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = (
            "id",
            "name",
            "description",
            "session_count",
            "is_active",
        )
        read_only_fields = ("id",)


class ClassCreateUpdateSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        source="subject",
        queryset=Subject.objects.all(),
    )

    class Meta:
        model = Class
        fields = (
            "id",
            "name",
            "subject_id",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
        )
        read_only_fields = ("id",)

    def validate_subject_id(self, subject):
        request = self.context.get("request")
        if request and request.user.academy_id != subject.academy_id:
            raise serializers.ValidationError(
                "Subject must belong to your academy."
            )
        return subject
