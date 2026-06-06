from django.urls import path
from .views import GradeViewSet
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r"grades", GradeViewSet, basename="grade")
urlpatterns = router.urls