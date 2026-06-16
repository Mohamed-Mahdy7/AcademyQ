from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AlertViewSet, RunScanView, ScanLogListView

router = DefaultRouter()
router.register(r"alerts", AlertViewSet, basename="alert")

urlpatterns = router.urls + [
    path("agent/run-scan/", RunScanView.as_view(), name="run-scan"),
    path("agent/scans/", ScanLogListView.as_view(), name="scan-logs"),
]