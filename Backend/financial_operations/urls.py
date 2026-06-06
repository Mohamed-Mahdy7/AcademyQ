from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeachersViewSet, EnrollmentViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'teachers', TeachersViewSet, basename='teachers')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollments')
router.register(r'payments', PaymentViewSet, basename='payments')

urlpatterns = [
    path('', include(router.urls)),
]