from django.http import JsonResponse
from django.conf import settings
from celery import current_app
from redis import Redis


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