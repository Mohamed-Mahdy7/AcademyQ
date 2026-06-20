 # grades/tests.py

from datetime import date, time, timedelta

from django.db.utils import IntegrityError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Academy, User, Students
from structure.models import Subject, Class
from financial_operations.models import Enrollment
from records.models import ClassSession
from grades.models import Grade
from grades.serializers import GradeSerializer


def create_academy(**kwargs):
    defaults = {
        "name": "Academy",
        "email": "academy@test.com",
        "phone": "01000000000",
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


def create_class(academy, subject, **kwargs):
    defaults = {
        "name": "Class A",
        "start_date": date.today(),
        "end_date": date.today() + timedelta(days=60),
    }
    defaults.update(kwargs)
    return Class.objects.create(academy=academy, subject=subject, **defaults)


class GradesTestSetupMixin:
    """Builds a consistent Academy/Student/Class/Enrollment/Session graph."""

    def base_setup(self):
        self.academy = create_academy(email=f"academy-{id(self)}@test.com")
        self.student_user, self.student_profile = create_student_with_profile(
            self.academy, email=f"student-{id(self)}@test.com"
        )
        self.subject = Subject.objects.create(
            academy=self.academy, name="Math", description="Math Subject"
        )
        self.class_obj = create_class(self.academy, self.subject, name="Math A")
        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        self.session = ClassSession.objects.create(
            session_date=date.today(), session_time=time(10, 0)
        )


# =========================================================
# MODELS
# =========================================================

class GradeModelTests(GradesTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_grade_creation(self):
        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=90,
            max_score=100,
            assigned_at=date.today(),
        )
        self.assertEqual(grade.score, 90)
        self.assertIsNotNone(grade.id)

    def test_grade_str(self):
        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=80,
            max_score=100,
            assigned_at=date.today(),
        )
        self.assertIn("80", str(grade))
        self.assertIn("100", str(grade))

    def test_unique_grade_constraint(self):
        Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=90,
            max_score=100,
            assigned_at=date.today(),
        )
        with self.assertRaises(IntegrityError):
            Grade.objects.create(
                enrollment=self.enrollment,
                session=self.session,
                subject_name="Math",
                score=95,
                max_score=100,
                assigned_at=date.today(),
            )

    def test_multiple_subjects_allowed_same_session(self):
        Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=90,
            max_score=100,
            assigned_at=date.today(),
        )
        second = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Physics",
            score=85,
            max_score=100,
            assigned_at=date.today(),
        )
        self.assertEqual(second.subject_name, "Physics")
        self.assertEqual(Grade.objects.count(), 2)

    def test_grade_session_set_null_on_session_delete(self):
        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=70,
            max_score=100,
            assigned_at=date.today(),
        )
        self.session.delete()
        grade.refresh_from_db()
        self.assertIsNone(grade.session)

    def test_grade_deleted_on_enrollment_delete(self):
        Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=70,
            max_score=100,
            assigned_at=date.today(),
        )
        self.enrollment.delete()
        self.assertEqual(Grade.objects.count(), 0)


# =========================================================
# SERIALIZERS
# =========================================================

class GradeSerializerTests(GradesTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_valid_data_creates_grade(self):
        serializer = GradeSerializer(data={
            "enrollment": self.enrollment.id,
            "session": self.session.id,
            "subject_name": "Math",
            "score": "95.00",
            "max_score": "100.00",
            "assigned_at": str(date.today()),
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        grade = serializer.save()
        self.assertEqual(grade.subject_name, "Math")

    def test_missing_required_field_invalid(self):
        serializer = GradeSerializer(data={
            "enrollment": self.enrollment.id,
            "session": self.session.id,
            "score": "95.00",
            "max_score": "100.00",
            "assigned_at": str(date.today()),
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("subject_name", serializer.errors)

    def test_session_num_none_when_no_junction(self):
        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=70,
            max_score=100,
            assigned_at=date.today(),
        )
        data = GradeSerializer(grade).data
        self.assertIsNone(data["session_num"])

    def test_session_num_resolved_from_junction(self):
        from structure.models import ClassSessionEnrollment
        ClassSessionEnrollment.objects.create(
            class_obj=self.class_obj, session=self.session, session_num=3
        )
        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=self.session,
            subject_name="Math",
            score=70,
            max_score=100,
            assigned_at=date.today(),
        )
        data = GradeSerializer(grade).data
        self.assertEqual(data["session_num"], 3)

    def test_session_num_none_when_session_is_null(self):
        grade = Grade.objects.create(
            enrollment=self.enrollment,
            session=None,
            subject_name="Math",
            score=70,
            max_score=100,
            assigned_at=date.today(),
        )
        data = GradeSerializer(grade).data
        self.assertIsNone(data["session_num"])


# =========================================================
# API / VIEWS
# =========================================================

class GradeViewSetApiTests(GradesTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)

    def create_grade(self, score, subject_name="Physics"):
        session = ClassSession.objects.create(
            session_date=date.today() + timedelta(days=ClassSession.objects.count() + 1),
            session_time=time(10, 0),
        )
        return Grade.objects.create(
            enrollment=self.enrollment,
            session=session,
            subject_name=subject_name,
            score=score,
            max_score=100,
            assigned_at=date.today(),
        )

    def test_grade_list(self):
        response = self.client.get("/api/grades/")
        self.assertEqual(response.status_code, 200)

    def test_grade_list_requires_owner(self):
        non_owner = create_user(
            self.academy, User.Roles.TEACHER, f"teacher-{id(self)}@test.com"
        )
        client = APIClient()
        client.force_authenticate(non_owner)
        response = client.get("/api/grades/")
        self.assertEqual(response.status_code, 403)

    def test_grade_create(self):
        response = self.client.post(
            "/api/grades/",
            {
                "enrollment": self.enrollment.id,
                "session": self.session.id,
                "subject_name": "Physics",
                "score": 95,
                "max_score": 100,
                "assigned_at": str(date.today()),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Grade.objects.count(), 1)

    def test_grade_retrieve(self):
        grade = self.create_grade(90)
        response = self.client.get(f"/api/grades/{grade.id}/")
        self.assertEqual(response.status_code, 200)

    def test_grade_update(self):
        grade = self.create_grade(70)
        response = self.client.patch(
            f"/api/grades/{grade.id}/", {"score": 85}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        grade.refresh_from_db()
        self.assertEqual(grade.score, 85)

    def test_grade_delete(self):
        grade = self.create_grade(70)
        response = self.client.delete(f"/api/grades/{grade.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Grade.objects.filter(id=grade.id).exists())

    def test_grade_put_not_allowed(self):
        grade = self.create_grade(70)
        response = self.client.put(
            f"/api/grades/{grade.id}/", {"score": 85}, format="json"
        )
        self.assertEqual(response.status_code, 405)

    def test_filter_by_enrollment(self):
        self.create_grade(70)
        response = self.client.get(
            f"/api/grades/?enrollment_ids={self.enrollment.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_other_academy_grades_not_visible(self):
        other_academy = create_academy(email=f"other-{id(self)}@test.com")
        other_owner = create_user(
            other_academy, User.Roles.OWNER, f"otherowner-{id(self)}@test.com"
        )
        self.create_grade(70)

        client = APIClient()
        client.force_authenticate(other_owner)
        response = client.get("/api/grades/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_summary_requires_enrollment(self):
        response = self.client.get("/api/grades/summary/")
        self.assertEqual(response.status_code, 400)

    def test_summary_empty(self):
        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["assessment_count"], 0)
        self.assertIsNone(response.data["average_pct"])

    def test_summary_average(self):
        self.create_grade(80)
        self.create_grade(90)
        self.create_grade(100)

        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["assessment_count"], 3)
        self.assertEqual(response.data["average_pct"], 90.0)

    def test_summary_improving(self):
        for score in [50, 55, 60, 70, 80, 90]:
            self.create_grade(score)

        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )
        self.assertEqual(response.data["trend"], "improving")

    def test_summary_declining(self):
        for score in [90, 90, 80, 70, 60, 55, 50]:
            self.create_grade(score)

        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )
        self.assertEqual(response.data["trend"], "declining")

    def test_summary_stable_with_single_grade(self):
        self.create_grade(80)
        response = self.client.get(
            f"/api/grades/summary/?enrollment_id={self.enrollment.id}"
        )
        self.assertIsNone(response.data["trend"])

    def test_class_summary_requires_class_id(self):
        response = self.client.get("/api/grades/class-summary/")
        self.assertEqual(response.status_code, 400)

    def test_class_summary(self):
        self.create_grade(80)
        self.create_grade(85)
        self.create_grade(90)

        response = self.client.get(
            f"/api/grades/class-summary/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("students", response.data)
        self.assertEqual(len(response.data["students"]), 1)
        student_summary = response.data["students"][0]
        self.assertEqual(student_summary["assessments"], 3)

    def test_class_summary_empty_when_no_grades(self):
        response = self.client.get(
            f"/api/grades/class-summary/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["students"], [])