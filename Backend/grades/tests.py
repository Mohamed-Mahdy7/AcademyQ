from django.test import TestCase

# Create your tests here.
from datetime import date, timedelta, time

from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Academy, User
from structure.models import Subject, Class
from financial_operations.models import Enrollment
from records.models import ClassSession
from grades.models import Grade


class GradeModelTests(TestCase):

    def setUp(self):

        self.academy = Academy.objects.create(
            name="Academy",
            email="academy@test.com",
            phone="01000000000",
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
            description="Math Subject"
        )

        self.class_obj = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Math A",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=60)
        )

        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        self.session = ClassSession.objects.create(
            session_date=date.today(),
            session_time=time(10, 0)
        )

    def test_grade_creation(self):

        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=90,
            max_score=100,
            assigned_at=date.today()
        )

        self.assertEqual(grade.score, 90)

    def test_grade_str(self):

        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=80,
            max_score=100,
            assigned_at=date.today()
        )

        self.assertTrue(str(grade))

    def test_unique_grade_constraint(self):

        Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=90,
            max_score=100,
            assigned_at=date.today()
        )

        with self.assertRaises(Exception):
            Grade.objects.create(
                enrollment=self.enrollment,
                session=self.session,
                subject_name="Math",
                score=95,
                max_score=100,
                assigned_at=date.today()
            )

    def test_multiple_subjects_allowed(self):

        Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=90,
            max_score=100,
            assigned_at=date.today()
        )

        second = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Physics",
            score=85,
            max_score=100,
            assigned_at=date.today()
        )

        self.assertEqual(second.subject_name, "Physics")


class GradeViewTests(TestCase):

    def setUp(self):

        self.client = APIClient()

        self.academy = Academy.objects.create(
            name="Academy",
            email="academy2@test.com",
            phone="01000000000",
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
            end_date=date.today() + timedelta(days=90)
        )

        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student
        )

        self.session = ClassSession.objects.create(
            session_date=date.today(),
            session_time=time(12, 0)
        )

    def create_grade(self, score):

        return Grade.objects.create(
            enrollment=self.enrollment,
            session=ClassSession.objects.create(
                session_date=date.today() + timedelta( days=ClassSession.objects.count() + 1),
                session_time=time(10, 0)
            ),
            subject_name="Physics",
            score=score,
            max_score=100,
            assigned_at=date.today()
        )

    def test_grade_list(self):

        response = self.client.get(
            "/api/grades/"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_grade_create(self):

        response = self.client.post(
            "/api/grades/",
            {
                "enrollment": self.enrollment.id,
                "session": self.session.id,
                "subject_name": "Physics",
                "score": 95,
                "max_score": 100,
                "assigned_at": str(date.today())
            },
            format="json"
        )

        self.assertIn(response.status_code, [200, 201])

    def test_grade_retrieve(self):

        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Physics",
            score=90,
            max_score=100,
            assigned_at=date.today()
        )

        response = self.client.get(
            f"/api/grades/{grade.id}/"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_grade_update(self):

        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Physics",
            score=70,
            max_score=100,
            assigned_at=date.today()
        )

        response = self.client.patch(
            f"/api/grades/{grade.id}/",
            {"score": 85},
            format="json"
        )

        self.assertIn(response.status_code, [200, 202])

    def test_grade_delete(self):

        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Physics",
            score=70,
            max_score=100,
            assigned_at=date.today()
        )

        response = self.client.delete(
            f"/api/grades/{grade.id}/"
        )

        self.assertIn(response.status_code, [200, 204])

    def test_filter_by_enrollment(self):

        response = self.client.get(
            f"/api/grades/?enrollment_id={self.enrollment.id}"
        )

        self.assertIn(response.status_code, [200, 301, 302])

    def test_summary_requires_enrollment(self):

        response = self.client.get(
            "/api/grades/summary/"
        )

        self.assertEqual(response.status_code, 400)

    def test_summary_empty(self):

        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )

        self.assertEqual(response.status_code, 200)

    def test_summary_average(self):

        self.create_grade(80)
        self.create_grade(90)
        self.create_grade(100)

        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["assessment_count"],
            3
        )

    def test_summary_improving(self):

        for score in [50, 55, 60, 70, 80, 90]:
            self.create_grade(score)

        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )

        self.assertEqual(
            response.data["trend"],
            "improving"
        )

    def test_summary_declining(self):
        for score in [90,90, 80, 70, 60, 55, 50]:
            self.create_grade(score)

        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )

        self.assertEqual(
            response.data["trend"],
            "declining"
        )

    def test_class_summary_requires_class_id(self):

        response = self.client.get(
            "/api/grades/class-summary/"
        )

        self.assertEqual(response.status_code, 400)

    def test_class_summary(self):

        self.create_grade(80)
        self.create_grade(85)
        self.create_grade(90)

        response = self.client.get(
            f"/api/grades/class-summary/?class_id={self.class_obj.id}"
        )

        self.assertEqual(response.status_code, 200)

        self.assertIn(
            "students",
            response.data
        )