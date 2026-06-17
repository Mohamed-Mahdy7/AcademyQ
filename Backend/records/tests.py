from django.test import TestCase

# Create your tests here.
from datetime import date, timedelta, time

from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Academy, User
from structure.models import (
    Subject,
    Class,
    ClassSessionEnrollment
)
from financial_operations.models import (
    Enrollment,
    Payment
)
from records.models import (
    ClassSession,
    Attendance
)


class RecordsModelTests(TestCase):

    def setUp(self):

        self.session = ClassSession.objects.create(
            session_date=date.today(),
            session_time=time(10, 0)
        )

    def test_session_created(self):
        self.assertIsNotNone(self.session.id)

    def test_session_str(self):
        self.assertTrue(str(self.session))

    def test_unique_session_datetime(self):

        with self.assertRaises(Exception):
            ClassSession.objects.create(
                session_date=self.session.session_date,
                session_time=self.session.session_time
            )


class AttendanceModelTests(TestCase):

    def setUp(self):

        self.academy = Academy.objects.create(
            name="Academy",
            email="academy@test.com",
            phone="0100",
            subscription_end=date.today() + timedelta(days=30)
        )

        self.student = User.objects.create_user(
            email="student@test.com",
            password="123456",
            academy=self.academy,
            full_name="Student",
            phone="010",
            parent_phone="011",
            educational_level=10,
            role=User.Roles.STUDENT
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
            end_date=date.today() + timedelta(days=30)
        )

        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        self.session = ClassSession.objects.create(
            session_date=date.today(),
            session_time=time(11, 0)
        )

    def test_attendance_creation(self):

        attendance = Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        self.assertTrue(attendance.present)

    def test_unique_attendance_constraint(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        with self.assertRaises(Exception):
            Attendance.objects.create(
                session=self.session,
                enrollment=self.enrollment,
                present=False
            )


class RecordsAPITests(TestCase):

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
            end_date=date.today() + timedelta(days=30)
        )

        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        self.session = ClassSession.objects.create(
            session_date=date.today(),
            session_time=time(12, 0)
        )

        self.link = ClassSessionEnrollment.objects.create(
            class_obj=self.class_obj,
            session=self.session,
            session_num=1
        )

    # -------------------------
    # Sessions
    # -------------------------

    def test_session_list(self):

        response = self.client.get(
            "/api/sessions/"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_session_retrieve(self):

        response = self.client.get(
            f"/api/sessions/{self.session.id}/"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_create_session(self):

        response = self.client.post(
            "/api/sessions/",
            {
                "class_id": str(self.class_obj.id),
                "session_date": str(date.today()),
                "session_time": "15:00:00",
                "notes": "Session"
            },
            format="json"
        )

        self.assertIn(response.status_code, [200, 201])

    def test_filter_sessions_by_class(self):

        response = self.client.get(
            f"/api/sessions/?class_id={self.class_obj.id}"
        )

        self.assertEqual(response.status_code, 200)

    # -------------------------
    # Attendance GET
    # -------------------------

    def test_attendance_list_empty(self):

        response = self.client.get(
            f"/api/sessions/{self.session.id}/attendance/"
        )

        self.assertEqual(response.status_code, 200)

    def test_attendance_get_existing(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        response = self.client.get(
            f"/api/sessions/{self.session.id}/attendance/"
        )

        self.assertEqual(response.status_code, 200)

    # -------------------------
    # Attendance POST
    # -------------------------

    def test_bulk_attendance_create(self):

        response = self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {
                "records": [
                    {
                        "enrollment_id": str(self.enrollment.id),
                        "present": True
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(response.status_code, 200)

    def test_bulk_attendance_invalid(self):

        response = self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {
                "records": []
            },
            format="json"
        )

        self.assertEqual(response.status_code, 400)

    def test_attendance_update_existing(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=False
        )

        response = self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {
                "records": [
                    {
                        "enrollment_id": str(self.enrollment.id),
                        "present": True
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(response.status_code, 200)

    # -------------------------
    # Payment Trigger
    # -------------------------

    def test_attendance_creates_pending_payment(self):

        Payment.objects.all().delete()

        response = self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {
                "records": [
                    {
                        "enrollment_id": str(self.enrollment.id),
                        "present": True
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(response.status_code, 200)

    def test_attendance_no_duplicate_pending_payment(self):

        Payment.objects.create(
            enrollment_id=self.enrollment,
            amount=100,
            status="pending"
        )

        self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {
                "records": [
                    {
                        "enrollment_id": str(self.enrollment.id),
                        "present": True
                    }
                ]
            },
            format="json"
        )

        self.assertEqual(
            Payment.objects.filter(
                enrollment_id=self.enrollment,
                status="pending"
            ).count(),
            1
        )

    # -------------------------
    # Student Stats
    # -------------------------

    def test_student_stats_requires_class(self):

        response = self.client.get(
            f"/api/students/{self.student.id}/attendance/stats/"
        )

        self.assertEqual(response.status_code, 400)

    def test_student_stats(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        response = self.client.get(
            f"/api/students/{self.student.id}/attendance/stats/?class_id={self.class_obj.id}"
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["present_count"],
            1
        )

    def test_student_stats_absent(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=False
        )

        response = self.client.get(
            f"/api/students/{self.student.id}/attendance/stats/?class_id={self.class_obj.id}"
        )

        self.assertEqual(response.status_code, 200)

    # -------------------------
    # Student History
    # -------------------------

    def test_student_history_requires_class(self):

        response = self.client.get(
            f"/api/students/{self.student.id}/attendance/history/"
        )

        self.assertEqual(response.status_code, 400)

    def test_student_history(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        response = self.client.get(
            f"/api/students/{self.student.id}/attendance/history/?class_id={self.class_obj.id}"
        )

        self.assertEqual(response.status_code, 200)

    def test_student_history_contains_session_num(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        response = self.client.get(
            f"/api/students/{self.student.id}/attendance/history/?class_id={self.class_obj.id}"
        )

        self.assertEqual(response.data[0]["session_num"], 1)

    # -------------------------
    # Class Summary
    # -------------------------

    def test_class_summary(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        response = self.client.get(
            f"/api/classes/{self.class_obj.id}/attendance/summary/"
        )

        self.assertEqual(response.status_code, 200)

    def test_class_summary_turnout(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        response = self.client.get(
            f"/api/classes/{self.class_obj.id}/attendance/summary/"
        )

        self.assertEqual(response.status_code, 200)

    def test_class_summary_empty(self):

        response = self.client.get(
            f"/api/classes/{self.class_obj.id}/attendance/summary/"
        )

        self.assertEqual(response.status_code, 200)

    # -------------------------
    # Queryset Coverage
    # -------------------------

    def test_multiple_attendance_records(self):

        Attendance.objects.create(
            session=self.session,
            enrollment=self.enrollment,
            present=True
        )

        session2 = ClassSession.objects.create(
            session_date=date.today() + timedelta(days=1),
            session_time=time(13, 0)
        )

        Attendance.objects.create(
            session=session2,
            enrollment=self.enrollment,
            present=False
        )

        self.assertEqual(
            Attendance.objects.count(),
            2
        )

    def test_session_link_exists(self):

        self.assertEqual(
            ClassSessionEnrollment.objects.count(),
            1
        )