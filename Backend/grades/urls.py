from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import GradeViewSet

router = DefaultRouter()
router.register(r'grades', GradeViewSet, basename='grade')

urlpatterns = [
    path('', include(router.urls)),
]