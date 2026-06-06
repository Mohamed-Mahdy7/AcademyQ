from rest_framework import serializers

from .models import Subject, Class


class ClassSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ["id", "name", "session_time", "start_date", "end_date", "is_active"]


class SubjectListSerializer(serializers.ModelSerializer):
    subject_details = serializers.HyperlinkedIdentityField(
        view_name="subject-detail",
        lookup_field="pk",
    )
    academy_name = serializers.CharField(source="academy.name", read_only=True)
    classes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subject
        fields = [
            "id",
            "subject_details",
            "academy",
            "academy_name",
            "name",
            "description",
            "session_count",
            "classes_count",
        ]


class SubjectDetailSerializer(serializers.ModelSerializer):
    academy_name = serializers.CharField(source="academy.name", read_only=True)
    classes_count = serializers.IntegerField(read_only=True)
    classes = ClassSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = [
            "id",
            "academy",
            "academy_name",
            "name",
            "description",
            "session_count",
            "classes_count",
            "classes",
        ]


class SubjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "description",
            "session_count",
        ]

    def validate(self, attrs):
        request = self.context["request"]
        academy = self.user.academy

        if Subjects.objects.filter(academy=academy, name=attrs["name"]).exists():
            raise serializers.ValidationError(
                "Subject with this name already exists in this academy"
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        academy = request.user.academy

        return Subject.objects.create(academy=academy, **validated_data)


class SubjectUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = [
            "name",
            "description",
            "session_count",
        ]

    def validate(self, attrs):
        request = self.context["request"]
        academy = request.user.academy

        name = attrs["name"]

        if (
            name
            and Subject.objects.filter(academy=academy, name=name)
            .exclude(id=self.instance.id)
            .exists()
        ):
            raise serializers.ValidationError("Subject already exists in this academy")

        return attrs
