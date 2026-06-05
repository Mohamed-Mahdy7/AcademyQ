
from rest_framework import serializers
from .models import Grade

class GradeSerializer(serializers.ModelSerializer):

    
    class Meta:
        model = Grade
        fields = [
            "id",
            "enrollment",
            "session",
            "subject_name",
            "score",
            "max_score",
            "created_at",
        ]
 
        read_only_fields = [
            "id",
            "created_at"
        ]
    