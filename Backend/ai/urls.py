from django.urls import path
from .views import *

urlpatterns = [
    path("health/celery/", celery_health, name="celery-health"),
    path("health/", health),
    path("usage/", AIUsageView.as_view(), name="ai-usage"),
]