from rest_framework.routers import DefaultRouter
from .views import AIReportCardViewSet

router = DefaultRouter()
router.register("reports", AIReportCardViewSet, basename="ai-report")

urlpatterns = router.urls