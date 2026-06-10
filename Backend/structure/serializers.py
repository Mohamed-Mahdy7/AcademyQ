from rest_framework import serializers

from .models import Subject, Class, TeacherClass
from financial_operations.models import Teachers


class ClassSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ["id", "name", "session_time", "start_date", "end_date", "is_active"]


class TeacherSummarySerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="user_id.full_name", read_only=True)

    class Meta:
        model = Teachers
        fields = ["id", "teacher_name", "session_duration", "rate_per_session"]


class ClassListSerializer(serializers.ModelSerializer):
    academy_name = serializers.CharField(source="academy.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_details = serializers.HyperlinkedIdentityField(
        view_name="class-detail",
        lookup_field="pk",
    )
    subject_session_count = serializers.IntegerField(
        source="subject.session_count", read_only=True
    )
    students_count = serializers.IntegerField(read_only=True)
    sessions_count = serializers.IntegerField(read_only=True)
    teacher_name = serializers.SerializerMethodField()
    sessions_this_week = serializers.IntegerField(read_only=True)

    class Meta:
        model = Class
        fields = [
            "id",
            "class_details",
            "academy",
            "academy_name",
            "subject",
            "subject_name",
            "subject_session_count",
            "name",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
            "students_count",
            "sessions_count",
            "teacher_name",
            "sessions_this_week",
        ]

    def get_teacher_name(self, obj):
        assignment = obj.teacher_assignments.select_related("teacher__user_id").first()
        if assignment:
            return assignment.teacher.user_id.full_name
        return None


class TeacherClassDetailSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(
        source="teacher.user_id.full_name", read_only=True
    )
    teacher_id = serializers.UUIDField(source="teacher.id", read_only=True)
    rate_per_session = serializers.DecimalField(
        source="teacher.rate_per_session",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = TeacherClass
        fields = [
            "teacher_id",
            "teacher_name",
            "assigned_at",
            "rate_per_session",
        ]

class ClassDetailSerializer(serializers.ModelSerializer):
    academy_name = serializers.CharField(source="academy.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_session_count = serializers.IntegerField(
        source="subject.session_count", read_only=True
    )
    students_count = serializers.IntegerField(read_only=True)
    sessions_count = serializers.IntegerField(read_only=True)
    avg_attendance = serializers.FloatField(read_only=True)
    teachers = TeacherClassDetailSerializer(
        source="teacher_assignments", many=True, read_only=True
    )

    class Meta:
        model = Class
        fields = [
            "id",
            "academy",
            "academy_name",
            "subject",
            "subject_name",
            "subject_session_count",
            "name",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
            "teachers",
            "students_count",
            "sessions_count",
            "avg_attendance",
        ]


class ClassCreateSerializer(serializers.ModelSerializer):
    teachers = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Teachers.objects.all(), required=False
    )

    class Meta:
        model = Class
        fields = [
            "id",
            "subject",
            "name",
            "session_time",
            "start_date",
            "end_date",
            "is_active",
            "teachers",
        ]

    def validate(self, attrs):
        request = self.context["request"]
        academy = request.user.academy
        subject = attrs.get("subject")
        if subject and subject.academy != academy:
            raise serializers.ValidationError(
                "Subject must belong to the same academy."
            )
        return attrs

    def create(self, validated_data):
        teachers = validated_data.pop("teachers", [])
        request = self.context["request"]
        academy = request.user.academy
        class_obj = Class.objects.create(academy=academy, **validated_data)
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
        academy = request.user.academy
        if Subject.objects.filter(academy=academy, name=attrs["name"]).exists():
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
