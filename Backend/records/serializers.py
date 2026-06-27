from rest_framework import serializers
from django.db import transaction
from .models import ClassSession, Attendance
from structure.models import ClassSessionEnrollment, Class
from django.utils import timezone
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
        class_ids = self.context['request'].data.get('class_ids', [])
        if not class_ids:
            raise serializers.ValidationError({'class_ids': 'This field is required and must be a non-empty list.'})

        if validated_data.get('session_date') > timezone.now().date():
            raise serializers.ValidationError({
                'session_date': ['Cannot create a session for a future date.']
            })

        classes = Class.objects.filter(id__in=class_ids, academy_id=self.context['request'].user.academy_id)
        if not classes.exists():
            raise serializers.ValidationError({'class_ids': 'No valid classes found.'})

        with transaction.atomic():
            session = ClassSession.objects.create(**validated_data)
            last_junction = None
            for cls in classes:
                last = (
                    ClassSessionEnrollment.objects
                    .select_for_update()
                    .filter(class_obj=cls)
                    .order_by('session_num')
                    .last()
                )
                next_num = (last.session_num + 1) if last else 1
                last_junction = ClassSessionEnrollment.objects.create(
                    session=session,
                    class_obj=cls,
                    session_num=next_num,
                )
        if last_junction:
            session.session_num = last_junction.session_num
        return session


class AttendanceSerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(
        source='enrollment.student_id.user_id',
        read_only=True
    )
    student_name = serializers.CharField(
        source='enrollment.student_id.user.full_name',
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