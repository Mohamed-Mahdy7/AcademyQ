from django.urls import path
from .views import celery_health

urlpatterns = [
    path("health/celery/", celery_health, name="celery-health"),
]