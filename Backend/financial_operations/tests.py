 # financial_operations/tests.py

from datetime import date, timedelta

from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Academy, User, Students
from structure.models import Subject, Class
from financial_operations.models import Teachers, Enrollment, Payment
from financial_operations.serializers import (
    TeachersSerializer,
    EnrollmentSerializer,
    PaymentSerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_academy(**kwargs):
    defaults = {
        "name": "Academy",
        "email": "academy@test.com",
        "phone": "0100",
        "subscription_end": timezone.now().date() + timedelta(days=30),
    }
    defaults.update(kwargs)
    return Academy.objects.create(**defaults)


def create_user(academy, role, email, **kwargs):
    defaults = {
        "full_name": "Test User",
        "phone": "01000000000",
        "password": "123456",
    }
    defaults.update(kwargs)
    password = defaults.pop("password")
    return User.objects.create_user(
        academy=academy, email=email, role=role, password=password, **defaults
    )


def create_student_with_profile(academy, email="student@test.com", **kwargs):
    user = create_user(academy, User.Roles.STUDENT, email, **kwargs)
    student = Students.objects.create(
        user=user,
        parent_email="parent@test.com",
        educational_level=Students.EducationalLevel.SEC_1,
        status=Students.Status.ACTIVE,
    )
    return user, student


def create_teacher_with_profile(academy, email="teacher@test.com", **kwargs):
    user = create_user(academy, User.Roles.TEACHER, email, **kwargs)
    teacher = Teachers.objects.create(academy_id=academy, user_id=user)
    return user, teacher


class FinancialTestSetupMixin:

    def base_setup(self):
        uid = id(self)
        self.academy = create_academy(email=f"academy-{uid}@test.com")
        self.teacher_user, self.teacher = create_teacher_with_profile(
            self.academy, email=f"teacher-{uid}@test.com"
        )
        self.student_user, self.student_profile = create_student_with_profile(
            self.academy, email=f"student-{uid}@test.com"
        )
        self.subject = Subject.objects.create(
            academy=self.academy, name="Math", description="Math"
        )
        self.class_obj = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class A",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_count=10,
            session_price=100,
        )


# ===========================================================================
# MODEL TESTS
# ===========================================================================

class TeachersModelTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_teacher_created(self):
        self.assertEqual(self.teacher.user_id.full_name, "Test User")

    def test_teacher_str(self):
        self.assertIn(str(self.teacher_user), str(self.teacher))

    def test_teacher_one_user_one_profile(self):
        with self.assertRaises(IntegrityError):
            Teachers.objects.create(
                academy_id=self.academy, user_id=self.teacher_user
            )

    def test_teacher_belongs_to_academy(self):
        self.assertEqual(self.teacher.academy_id, self.academy)


class EnrollmentModelTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_enrollment_creation_default_status_active(self):
        enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        self.assertEqual(enrollment.status, "active")

    def test_enrollment_str(self):
        enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        self.assertIn(str(enrollment.id), str(enrollment))

    def test_unique_enrollment_per_student_class(self):
        Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        with self.assertRaises(IntegrityError):
            Enrollment.objects.create(
                class_id=self.class_obj, student_id=self.student_profile
            )

    def test_enrollment_protected_on_class_delete(self):
        from django.db.models import ProtectedError
        Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        with self.assertRaises(ProtectedError):
            self.class_obj.delete()

    def test_same_student_can_enroll_different_classes(self):
        Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        second_class = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class B",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        second_enrollment = Enrollment.objects.create(
            class_id=second_class, student_id=self.student_profile
        )
        self.assertEqual(Enrollment.objects.count(), 2)
        self.assertIsNotNone(second_enrollment.id)

    def test_enrollment_start_date_optional(self):
        enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        self.assertIsNone(enrollment.start_date)


class PaymentModelTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )

    def test_payment_creation(self):
        payment = Payment.objects.create(
            enrollment_id=self.enrollment, amount=1000
        )
        self.assertEqual(payment.amount, 1000)

    def test_payment_default_status_pending(self):
        payment = Payment.objects.create(
            enrollment_id=self.enrollment, amount=500
        )
        self.assertEqual(payment.status, "pending")

    def test_payment_str(self):
        payment = Payment.objects.create(
            enrollment_id=self.enrollment, amount=500
        )
        self.assertIn(str(payment.id), str(payment))

    def test_payment_protected_on_enrollment_delete(self):
        from django.db.models import ProtectedError
        Payment.objects.create(enrollment_id=self.enrollment, amount=500)
        with self.assertRaises(ProtectedError):
            self.enrollment.delete()

    def test_payment_all_status_choices(self):
        for status in ("pending", "completed", "cancelled", "deleted"):
            payment = Payment.objects.create(
                enrollment_id=self.enrollment, amount=100, status=status
            )
            self.assertEqual(payment.status, status)
            payment.delete()


# ===========================================================================
# SERIALIZER TESTS
# ===========================================================================

class TeachersSerializerTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_serializer_exposes_user_fields(self):
        data = TeachersSerializer(self.teacher).data
        self.assertEqual(data["name"], self.teacher_user.full_name)
        self.assertEqual(data["email"], self.teacher_user.email)
        self.assertEqual(data["phone"], self.teacher_user.phone)

    def test_serializer_has_required_keys(self):
        data = TeachersSerializer(self.teacher).data
        for key in ("id", "name", "email", "phone"):
            self.assertIn(key, data)


class EnrollmentSerializerTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )

    def test_serializer_exposes_names(self):
        data = EnrollmentSerializer(self.enrollment).data
        self.assertEqual(data["class_name"], self.class_obj.name)
        self.assertEqual(data["status"], "active")
        self.assertEqual(data["payments"], [])

    def test_serializer_includes_nested_payments(self):
        Payment.objects.create(enrollment_id=self.enrollment, amount=300)
        data = EnrollmentSerializer(self.enrollment).data
        self.assertEqual(len(data["payments"]), 1)
        self.assertEqual(data["payments"][0]["amount"], "300.00")

    def test_serializer_student_name_present(self):
        data = EnrollmentSerializer(self.enrollment).data
        self.assertEqual(data["student_name"], self.student_user.full_name)


class PaymentSerializerTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )

    def test_serializer_exposes_class_and_student_name(self):
        payment = Payment.objects.create(
            enrollment_id=self.enrollment, amount=500
        )
        data = PaymentSerializer(payment).data
        self.assertEqual(data["class_name"], self.class_obj.name)
        self.assertEqual(data["student_name"], self.student_user.full_name)

    def test_serializer_amount_precision(self):
        payment = Payment.objects.create(
            enrollment_id=self.enrollment, amount="750.50"
        )
        data = PaymentSerializer(payment).data
        self.assertEqual(data["amount"], "750.50")


# ===========================================================================
# API / VIEW TESTS
# ===========================================================================

class TeachersApiTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_teachers_list(self):
        response = self.client.get("/api/teachers/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_teacher_soft_delete_deactivates_user(self):
        response = self.client.delete(f"/api/teachers/{self.teacher.id}/")
        self.assertEqual(response.status_code, 204)
        self.teacher_user.refresh_from_db()
        self.assertFalse(self.teacher_user.is_active)
        # Teacher profile row remains (soft delete)
        self.assertTrue(Teachers.objects.filter(id=self.teacher.id).exists())

    def test_other_academy_teachers_not_visible(self):
        other_academy = create_academy(email=f"otheracad-{id(self)}@test.com")
        create_teacher_with_profile(other_academy, email=f"otherteacher-{id(self)}@test.com")
        response = self.client.get("/api/teachers/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_unauthenticated_cannot_list_teachers(self):
        anon = APIClient()
        response = anon.get("/api/teachers/")
        self.assertIn(response.status_code, [401, 403])


class EnrollmentApiTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_create_enrollment(self):
        response = self.client.post(
            "/api/enrollments/",
            {
                "class_id": self.class_obj.id,
                "student_id": self.student_profile.user.id,
                "start_date": str(date.today()),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_create_enrollment_creates_pending_payment(self):
        self.client.post(
            "/api/enrollments/",
            {
                "class_id": self.class_obj.id,
                "student_id": self.student_profile.user.id,
                "start_date": str(date.today()),
            },
            format="json",
        )
        self.assertTrue(
            Payment.objects.filter(status="pending").exists()
        )
        payment = Payment.objects.first()
        self.assertEqual(payment.amount, 1000)

    def test_create_enrollment_sets_student_active(self):
        new_student_user, new_student = create_student_with_profile(
            self.academy, email=f"pendingstudent-{id(self)}@test.com"
        )
        new_student.status = Students.Status.PENDING
        new_student.save()

        self.client.post(
            "/api/enrollments/",
            {
                "class_id": self.class_obj.id,
                "student_id": new_student.user.id,
                "start_date": str(date.today()),
            },
            format="json",
        )
        new_student.refresh_from_db()
        self.assertEqual(new_student.status, Students.Status.ACTIVE)

    def test_duplicate_enrollment_rejected(self):
        Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        response = self.client.post(
            "/api/enrollments/",
            {
                "class_id": self.class_obj.id,
                "student_id": self.student_profile.user.id,
                "start_date": str(date.today()),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_enrollment_list(self):
        Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        response = self.client.get("/api/enrollments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_filter_enrollment_by_student(self):
        Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        response = self.client.get(
            f"/api/enrollments/?student_id={self.student_profile.user.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_filter_enrollment_by_status(self):
        Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        response = self.client.get("/api/enrollments/?status=active")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_filter_enrollment_by_class(self):
        Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        response = self.client.get(
            f"/api/enrollments/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_soft_delete_enrollment_marks_dropped(self):
        enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        response = self.client.delete(f"/api/enrollments/{enrollment.id}/")
        self.assertEqual(response.status_code, 204)
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, "dropped")


class PaymentApiTests(FinancialTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)
        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )

    def test_payment_list(self):
        Payment.objects.create(enrollment_id=self.enrollment, amount=500)
        response = self.client.get("/api/payments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_payment_list_excludes_deleted(self):
        Payment.objects.create(
            enrollment_id=self.enrollment, amount=500, status="deleted"
        )
        response = self.client.get("/api/payments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_filter_payments_by_status(self):
        Payment.objects.create(
            enrollment_id=self.enrollment, amount=500, status="pending"
        )
        Payment.objects.create(
            enrollment_id=self.enrollment, amount=300, status="completed",
            due_date=date.today(),
        )
        response = self.client.get("/api/payments/?status=pending")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_filter_payments_by_month(self):
        month = date.today().strftime("%Y-%m")
        Payment.objects.create(
            enrollment_id=self.enrollment, amount=500, due_date=date.today()
        )
        response = self.client.get(f"/api/payments/?month={month}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_filter_payments_by_enrollment(self):
        Payment.objects.create(enrollment_id=self.enrollment, amount=500)
        response = self.client.get(
            f"/api/payments/?enrollment_id={self.enrollment.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_soft_delete_payment(self):
        payment = Payment.objects.create(enrollment_id=self.enrollment, amount=500)
        response = self.client.delete(f"/api/payments/{payment.id}/")
        self.assertEqual(response.status_code, 204)
        payment.refresh_from_db()
        self.assertEqual(payment.status, "deleted")

    def test_payment_summary_no_data(self):
        response = self.client.get("/api/payments/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("revenue_expected", response.data)
        self.assertIn("collection_rate_pct", response.data)

    def test_payment_summary_month_filter(self):
        month = date.today().strftime("%Y-%m")
        response = self.client.get(f"/api/payments/summary/?month={month}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["month"], month)

    def test_payment_summary_collection_rate(self):
        Payment.objects.create(
            enrollment_id=self.enrollment,
            amount=1000,
            due_date=date.today(),
            status="completed",
        )
        response = self.client.get("/api/payments/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["collection_rate_pct"], 100.0)


# ===========================================================================
# INTEGRATION TESTS
# ===========================================================================

class EnrollmentPaymentIntegrationTests(FinancialTestSetupMixin, TestCase):
    """Verify that enrolling a student automatically creates a payment."""

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-integ-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_enroll_then_pay_then_soft_delete(self):
        enroll_resp = self.client.post(
            "/api/enrollments/",
            {
                "class_id": self.class_obj.id,
                "student_id": self.student_profile.user.id,
                "start_date": str(date.today()),
            },
            format="json",
        )
        self.assertEqual(enroll_resp.status_code, 201)
        enrollment = Enrollment.objects.get(id=enroll_resp.data["id"])

        payment = Payment.objects.get(enrollment_id=enrollment)
        self.assertEqual(payment.status, "pending")

        payment.status = "completed"
        payment.save()

        del_resp = self.client.delete(f"/api/enrollments/{enrollment.id}/")
        self.assertEqual(del_resp.status_code, 204)
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, "dropped")
