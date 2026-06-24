from rest_framework import serializers

class AIUsageByFeatureSerializer(serializers.Serializer):
    feature = serializers.CharField()
    label = serializers.CharField()
    calls = serializers.IntegerField()
    cost_usd = serializers.DecimalField(max_digits=10, decimal_places=6)

