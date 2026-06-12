from rest_framework import serializers
from django.db import transaction
from .models import ClassSession, Attendance


class ClassSessionSerializer(serializers.ModelSerializer):
    present_count = serializers.IntegerField(read_only=True)
    absent_count = serializers.IntegerField(read_only=True)
    total_enrolled = serializers.IntegerField(read_only=True)
    session_num = serializers.IntegerField(read_only=True)

    class Meta:
        model = ClassSession
        fields = [
            'id',
            'session_date',
            'session_time',
            'notes',
            'session_num',
            'present_count',
            'absent_count',
            'total_enrolled',
        ]

    def create(self, validated_data):
        class_obj_id = self.context['request'].data.get('class_id')
        if not class_obj_id:
            raise serializers.ValidationError({'class_id': 'This field is required.'})

        from structure.models import ClassSessionEnrollment, Class
        try:
            cls = Class.objects.get(id=class_obj_id)
        except Class.DoesNotExist:
            raise serializers.ValidationError({'class_id': 'Class not found.'})

        with transaction.atomic():
            last = (
                ClassSessionEnrollment.objects
                .select_for_update()
                .filter(class_obj=cls)
                .order_by('session_num')
                .last()
            )
            next_num = (last.session_num + 1) if last else 1
            session = ClassSession.objects.create(**validated_data)
            ClassSessionEnrollment.objects.create(
                session=session,
                class_obj=cls,
                session_num=next_num,
            )
        return session


class AttendanceSerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(
        source='enrollment.student_id.id',
        read_only=True
    )
    student_name = serializers.CharField(
        source='enrollment.student_id.full_name',
        read_only=True
    )

    class Meta:
        model = Attendance
        fields = [
            'id',
            'session',
            'enrollment',
            'student_id',
            'student_name',
            'present',
            'recorded_at',
        ]
        read_only_fields = ['recorded_at', 'student_id', 'student_name']

class AttendanceBulkItemSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField()
    present = serializers.BooleanField()


class AttendanceBulkSerializer(serializers.Serializer):
    records = AttendanceBulkItemSerializer(many=True)

    def validate_records(self, value):
        if not value:
            raise serializers.ValidationError("records list cannot be empty.")
        return value