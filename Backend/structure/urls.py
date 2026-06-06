from rest_framework.routers import DefaultRouter

from .views import (
    ClassViewSet,
    SubjectViewSet,
)

router = DefaultRouter()

router.register("subjects", SubjectViewSet, basename="subject")
router.register("classes", ClassViewSet, basename="class")

urlpatterns = router.urls
