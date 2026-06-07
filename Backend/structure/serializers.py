from rest_framework import serializers

from .models import Subject, Class, TeacherClass
from financial_operations.models import Teachers


class ClassSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ["id", "name", "session_time", "start_date", "end_date", "is_active"]


class ClassListSerializer(serializers.ModelSerializer):
    academy_name = serializers.CharField(source="academy.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_details = serializers.HyperlinkedIdentityField(
        view_name="class-detail",
        lookup_field="pk",
    )

    class Meta:
        model = Class
        fields = [
            "id",
            "class_details",
            "academy",
            "academy_name",
            "subject",
            "subject_name",
            "name",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
        ]


class ClassDetailSerializer(serializers.ModelSerializer):
    academy_name = serializers.CharField(source="academy.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    students_count = serializers.IntegerField(read_only=True)
    sessions_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Class
        fields = [
            "id",
            "academy",
            "academy_name",
            "subject",
            "subject_name",
            "name",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
            "teachers",
            "students_count",
            "sessions_count",
        ]


class ClassCreateSerializer(serializers.ModelSerializer):
    teachers = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Teachers.objects.all(), required=False
    )

    class Meta:
        model = Class
        fields = [
            "id",
            "academy",
            "subject",
            "name",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
            "teachers",
        ]

    def validate(self, attrs):
        academy = attrs.get("academy")
        subject = attrs.get("subject")

        if subject and academy and subject.academy != academy:
            raise serializers.ValidationError(
                "Subject must belong to the same academy."
            )

        return attrs

    def create(self, validated_data):
        teachers = validated_data.pop("teachers", [])
        request = self.context["request"]

        class_obj = Class.objects.create(**validated_data)

        for teacher in teachers:
            TeacherClass.objects.create(
                assigned_class=class_obj,
                teacher=teacher,
                assigned_at=validated_data.get("start_date"),
            )

        return class_obj


class ClassUpdateSerializer(serializers.ModelSerializer):
    teachers = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Teachers.objects.all(), required=False
    )

    class Meta:
        model = Class
        fields = [
            "subject",
            "name",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
            "teachers",
        ]

    def validate(self, attrs):
        instance = self.instance

        subject = attrs.get("subject", instance.subject)

        if subject.academy != instance.academy:
            raise serializers.ValidationError(
                "Subject must belong to the same academy."
            )

        return attrs

    def update(self, instance, validated_data):
        teachers = validated_data.pop("teachers", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if teachers is not None:
            TeacherClass.objects.filter(assigned_class=instance).delete()

            for teacher in teachers:
                TeacherClass.objects.create(
                    assigned_class=instance,
                    teacher=teacher,
                    assigned_at=instance.start_date,
                )

        return instance


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
