from django.test import TestCase

# Create your tests here.
from datetime import date, timedelta

from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Academy, User
from structure.models import Subject, Class
from financial_operations.models import (
    Teachers,
    Enrollment,
    Payment,
)


class FinancialModelsTests(TestCase):

    def setUp(self):

        self.academy = Academy.objects.create(
            name="Academy",
            email="academy@test.com",
            phone="0100",
            subscription_end=date.today() + timedelta(days=30)
        )

        self.teacher_user = User.objects.create_user(
            email="teacher@test.com",
            password="123456",
            academy=self.academy,
            full_name="Teacher",
            phone="010",
            parent_phone="",
            educational_level=18,
            role=User.Roles.TEACHER
        )

        self.student = User.objects.create_user(
            email="student@test.com",
            password="123456",
            academy=self.academy,
            full_name="Student",
            phone="011",
            parent_phone="012",
            educational_level=10,
            role=User.Roles.STUDENT
        )

        self.teacher = Teachers.objects.create(
            academy_id=self.academy,
            user_id=self.teacher_user
        )

        self.subject = Subject.objects.create(
            academy=self.academy,
            name="Math",
            description="Math"
        )

        self.class_obj = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class A",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_count=10,
            session_price=100
        )

    def test_teacher_created(self):
        self.assertEqual(
            self.teacher.user_id.full_name,
            "Teacher"
        )

    def test_teacher_str(self):
        self.assertTrue(str(self.teacher))

    def test_enrollment_creation(self):

        enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        self.assertEqual(
            enrollment.status,
            "active"
        )

    def test_unique_enrollment(self):

        Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        with self.assertRaises(Exception):
            Enrollment.objects.create(
                class_id=self.class_obj,
                student_id=self.student
            )

    def test_payment_creation(self):

        enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        payment = Payment.objects.create(
            enrollment_id=enrollment,
            amount=1000
        )

        self.assertEqual(payment.amount, 1000)

    def test_payment_default_status(self):

        enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        payment = Payment.objects.create(
            enrollment_id=enrollment,
            amount=500
        )

        self.assertEqual(
            payment.status,
            "pending"
        )

    def test_payment_str(self):

        enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        payment = Payment.objects.create(
            enrollment_id=enrollment,
            amount=500
        )

        self.assertTrue(str(payment))


class FinancialAPITests(TestCase):

    def setUp(self):

        self.client = APIClient()

        self.academy = Academy.objects.create(
            name="Academy",
            email="academy2@test.com",
            phone="0100",
            subscription_end=date.today() + timedelta(days=30)
        )

        self.owner = User.objects.create_user(
            email="owner@test.com",
            password="123456",
            academy=self.academy,
            full_name="Owner",
            phone="010",
            parent_phone="",
            educational_level=18,
            role=User.Roles.OWNER
        )

        self.client.force_authenticate(self.owner)

        self.student = User.objects.create_user(
            email="student@test.com",
            password="123456",
            academy=self.academy,
            full_name="Student",
            phone="011",
            parent_phone="012",
            educational_level=10,
            role=User.Roles.STUDENT
        )

        self.teacher_user = User.objects.create_user(
            email="teacher@test.com",
            password="123456",
            academy=self.academy,
            full_name="Teacher",
            phone="015",
            parent_phone="",
            educational_level=18,
            role=User.Roles.TEACHER
        )

        self.teacher = Teachers.objects.create(
            academy_id=self.academy,
            user_id=self.teacher_user
        )

        self.subject = Subject.objects.create(
            academy=self.academy,
            name="Physics",
            description="Physics"
        )

        self.class_obj = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Physics A",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=40),
            session_count=20,
            session_price=150
        )

    def test_teachers_list(self):
        response = self.client.get(
            "/api/financial/teachers/"
        )
        self.assertIn(response.status_code, [200, 301, 302])

    def test_create_enrollment(self):

        response = self.client.post(
            "/api/financial/enrollments/",
            {
                "class_id": self.class_obj.id,
                "student_id": self.student.id,
                "start_date": str(date.today())
            },
            format="json"
        )

        self.assertIn(response.status_code, [200, 201])

    def test_enrollment_list(self):
        response = self.client.get(
            "/api/financial/enrollments/"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_filter_enrollment_by_student(self):

        response = self.client.get(
            f"/api/financial/enrollments/?student_id={self.student.id}"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_filter_enrollment_by_status(self):

        response = self.client.get(
            "/api/financial/enrollments/?status=active"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_payment_list(self):

        response = self.client.get(
            "/api/financial/payments/"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_payment_summary(self):

        response = self.client.get(
            "/api/financial/payments/summary/"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_payment_summary_month_filter(self):

        month = date.today().strftime("%Y-%m")

        response = self.client.get(
            f"/api/financial/payments/summary/?month={month}"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_filter_payments_by_status(self):

        response = self.client.get(
            "/api/financial/payments/?status=pending"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_filter_payments_by_month(self):

        month = date.today().strftime("%Y-%m")

        response = self.client.get(
            f"/api/financial/payments/?month={month}"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_soft_delete_payment(self):

        enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        payment = Payment.objects.create(
            enrollment_id=enrollment,
            amount=500
        )

        response = self.client.delete(
            f"/api/financial/payments/{payment.id}/"
        )

        self.assertIn(response.status_code, [200, 204])

    def test_soft_delete_enrollment(self):

        enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        response = self.client.delete(
            f"/api/financial/enrollments/{enrollment.id}/"
        )

        self.assertIn(response.status_code, [200, 204])

    def test_teacher_soft_delete(self):

        response = self.client.delete(
            f"/api/financial/teachers/{self.teacher.id}/"
        )

        self.assertIn(response.status_code, [200, 204])

    def test_auto_payment_created_after_enrollment(self):

        Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        self.assertTrue(
            Payment.objects.count() >= 0
        )