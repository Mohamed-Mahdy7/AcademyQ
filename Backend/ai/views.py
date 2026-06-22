from django.http import JsonResponse
from django.conf import settings
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer
from decimal import Decimal
from celery import current_app
from redis import Redis
from .serializers import AIUsageByFeatureSerializer
from ai.models import AIUsageLog
from core.permissions import IsOwner


def celery_health(request):
    try:
        inspect = current_app.control.inspect()
        stats = inspect.stats()
        
        if stats is None:
            return JsonResponse({
                "status": "error",
                "message": "No celery workers available",
            }, status=503)
        
        redis_client = Redis.from_url(settings.CELERY_BROKER_URL)
        queue_length = redis_client.llen("celery")
        
        return JsonResponse({
                "status": "ok",
                "message": list(stats.keys()),
                "pending_tasks": queue_length,
            })
        
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e),
        }, status=503)

@extend_schema(
    tags=["AI Infra"],
    responses=inline_serializer(
        "AIUsageSummary",
        fields={
            "month": serializers.CharField(),
            "total_calls": serializers.IntegerField(),
            "successful_calls": serializers.IntegerField(),
            "failed_calls": serializers.IntegerField(),
            "cache_hits": serializers.IntegerField(),
            "cache_hit_rate_pct": serializers.FloatField(),
            "total_cost_usd": serializers.DecimalField(max_digits=10, decimal_places=6),
            "by_feature": AIUsageByFeatureSerializer(many=True),
        },
    ),
)
class AIUsageView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        logs = AIUsageLog.objects.filter(
            academy=request.user.academy,
            called_at__gte=month_start,
        )

        summary = logs.aggregate(
            total_calls=Count("id"),
            successful_calls=Count("id", filter=Q(succeeded=True)),
            failed_calls=Count("id", filter=Q(succeeded=False)),
            total_cost=Sum("total_cost_usd"),
            # Cache hits: succeeded but cost=$0 — real calls always cost something
            cache_hits=Count("id", filter=Q(cache_hit=True)),
        )

        total_calls = summary["total_calls"] or 0
        successful_calls = summary["successful_calls"] or 0
        cache_hits = summary["cache_hits"] or 0

        by_feature = []
        for feature_value, feature_label in AIUsageLog.Feature.choices:
            agg = logs.filter(feature=feature_value).aggregate(
                calls=Count("id"),
                cost=Sum("total_cost_usd"),
            )
            if agg["calls"]:
                by_feature.append({
                    "feature": feature_value,
                    "label": feature_label,
                    "calls": agg["calls"],
                    "cost_usd": agg["cost"] or Decimal("0"),
                })

        return Response({
            "month": now.strftime("%Y-%m"),
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "failed_calls": summary["failed_calls"] or 0,
            "cache_hits": cache_hits,
            "cache_hit_rate_pct": (
                round(cache_hits / successful_calls * 100, 2) if successful_calls else 0
            ),
            "total_cost_usd": summary["total_cost"] or Decimal("0"),
            "by_feature": by_feature,
        })