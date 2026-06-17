from rest_framework.routers import DefaultRouter
from core.views import UserViewSet
from ai.reports.views import AIReportCardViewSet
from financial_operations.views import (
    EnrollmentViewSet,
    TeachersViewSet,
    PaymentViewSet,
)
from grades.views import GradeViewSet
from structure.views import (
    SubjectViewSet,
    ClassViewSet,
    ClassScheduleViewSet,
    ClassSessionEnrollmentViewSet,
)
from ai.agent.views import AlertViewSet
from ai.notifications.views import NotificationViewSet

router = DefaultRouter()

router.register("users", UserViewSet, basename="users")
router.register(r"teachers", TeachersViewSet, basename="teachers")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollments")
router.register(r"payments", PaymentViewSet, basename="payments")
router.register(r"grades", GradeViewSet, basename="grade")
router.register("subjects", SubjectViewSet, basename="subject")
router.register("classes", ClassViewSet, basename="class")
router.register("class-schedule", ClassScheduleViewSet, basename="class-schedule")
router.register(
    "class-session-enrollments",
    ClassSessionEnrollmentViewSet,
    basename="class-session-enrollment",
)
router.register("reports", AIReportCardViewSet, basename="ai-report")
router.register("alerts", AlertViewSet, basename="alert"),
router.register('notifications', NotificationViewSet, basename='notifications')


urlpatterns = router.urls
