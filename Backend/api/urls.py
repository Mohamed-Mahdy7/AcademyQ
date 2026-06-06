from rest_framework.routers import DefaultRouter
from core.views import UserViewSet
from financial_operations.views import EnrollmentViewSet, TeachersViewSet, PaymentViewSet
from grades.views import GradeViewSet
from structure.views import SubjectViewSet, ClassViewSet

router = DefaultRouter()

router.register("users", UserViewSet, basename="users")
router.register(r'teachers', TeachersViewSet, basename='teachers')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollments')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r"grades", GradeViewSet, basename="grade")
router.register("subjects", SubjectViewSet, basename="subject")
router.register("classes", ClassViewSet, basename="class")

urlpatterns = router.urls