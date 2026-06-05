from rest_framework import serializers
from .models import SubjectSession, Attendance
from django.db import transaction


class SubjectSessionSerializer(serializers.ModelSerializer):
    present_count = serializers.IntegerField(read_only=True)
    absent_count = serializers.IntegerField(read_only=True)
    total_enrolled = serializers.IntegerField(read_only=True)

    class Meta:
        model = SubjectSession
        fields = [
            'id',
            'class_obj',
            'session_num',
            'session_date',
            'notes',
            'present_count',
            'absent_count',
            'total_enrolled',
        ]
        read_only_fields = ['session_num']

    def create(self, validated_data):

        class_obj = validated_data['class_obj']
        with transaction.atomic():
            last = (
                SubjectSession.objects
                .select_for_update()
                .filter(class_obj=class_obj)
                .order_by('session_num')
                .last()
            )
            validated_data['session_num'] = (last.session_num + 1) if last else 1
            return super().create(validated_data)


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = [
            'id',
            'session',
            'enrollment',
            'present',
            'recorded_at',
        ]
        read_only_fields = ['recorded_at']


class AttendanceBulkItemSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField()
    present = serializers.BooleanField()


class AttendanceBulkSerializer(serializers.Serializer):
    records = AttendanceBulkItemSerializer(many=True)

    def validate_records(self, value):
        if not value:
            raise serializers.ValidationError("records list cannot be empty.")
        return value