 # structure/tests.py

from datetime import date, time, timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Academy, User, Students
from structure.models import (
    Subject,
    Class,
    TeacherClass,
    ClassSchedule,
    ClassSessionEnrollment,
)
from structure.serializers import (
    SubjectListSerializer,
    ClassListSerializer,
    ClassCreateSerializer,
)
from financial_operations.models import Teachers
from records.models import ClassSession


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


def create_teacher_with_profile(academy, email="teacher@test.com", **kwargs):
    user = create_user(academy, User.Roles.TEACHER, email, **kwargs)
    teacher = Teachers.objects.create(academy_id=academy, user_id=user)
    return user, teacher


class StructureTestSetupMixin:

    def base_setup(self):
        uid = id(self)
        self.academy = create_academy(email=f"academy-{uid}@test.com")
        self.teacher_user, self.teacher = create_teacher_with_profile(
            self.academy, email=f"teacher-{uid}@test.com"
        )
        self.subject = Subject.objects.create(
            academy=self.academy, name="Math", description="Math"
        )


# =========================================================
# MODELS
# =========================================================

class SubjectModelTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_subject_creation(self):
        self.assertEqual(self.subject.name, "Math")

    def test_subject_str(self):
        self.assertEqual(str(self.subject), "Math")

    def test_subject_unique_per_academy(self):
        with self.assertRaises(Exception):
            Subject.objects.create(
                academy=self.academy, name="Math", description="duplicate"
            )

    def test_same_subject_name_allowed_in_different_academy(self):
        other_academy = create_academy(email=f"other-{id(self)}@test.com")
        other_subject = Subject.objects.create(
            academy=other_academy, name="Math", description="Math too"
        )
        self.assertEqual(other_subject.name, "Math")


class ClassModelTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_class_creation(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class A",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        self.assertEqual(cls.name, "Class A")
        self.assertTrue(cls.is_active)

    def test_class_invalid_dates(self):
        cls = Class(
            academy=self.academy,
            subject=self.subject,
            name="Invalid",
            start_date=date.today(),
            end_date=date.today(),
        )
        with self.assertRaises(ValidationError):
            cls.full_clean()

    def test_class_save_runs_full_clean(self):
        with self.assertRaises(ValidationError):
            Class.objects.create(
                academy=self.academy,
                subject=self.subject,
                name="Invalid Save",
                start_date=date.today(),
                end_date=date.today() - timedelta(days=1),
            )

    def test_class_price_property(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Price Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_count=20,
            session_price=100,
        )
        self.assertEqual(cls.class_price, 2000)

    def test_class_price_none_when_missing_fields(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="No Price Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        self.assertIsNone(cls.class_price)

    def test_class_unique_name_per_subject_academy(self):
        Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Dup Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        with self.assertRaises(Exception):
            Class.objects.create(
                academy=self.academy,
                subject=self.subject,
                name="Dup Class",
                start_date=date.today(),
                end_date=date.today() + timedelta(days=30),
            )

    def test_class_str(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Str Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        self.assertEqual(str(cls), "Str Class")


class TeacherClassModelTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Assignment",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )

    def test_teacher_assignment(self):
        tc = TeacherClass.objects.create(
            assigned_class=self.cls, teacher=self.teacher, assigned_at=date.today()
        )
        self.assertEqual(tc.teacher, self.teacher)

    def test_teacher_assignment_str(self):
        tc = TeacherClass.objects.create(
            assigned_class=self.cls, teacher=self.teacher, assigned_at=date.today()
        )
        self.assertIn(self.cls.name, str(tc))

    def test_teacher_duplicate_assignment_rejected(self):
        TeacherClass.objects.create(
            assigned_class=self.cls, teacher=self.teacher, assigned_at=date.today()
        )
        with self.assertRaises(Exception):
            TeacherClass.objects.create(
                assigned_class=self.cls, teacher=self.teacher, assigned_at=date.today()
            )

    def test_teacher_assignment_before_start_invalid(self):
        tc = TeacherClass(
            assigned_class=self.cls,
            teacher=self.teacher,
            assigned_at=date.today() - timedelta(days=1),
        )
        with self.assertRaises(ValidationError):
            tc.full_clean()

    def test_teacher_assignment_after_end_invalid(self):
        tc = TeacherClass(
            assigned_class=self.cls,
            teacher=self.teacher,
            assigned_at=self.cls.end_date + timedelta(days=10),
        )
        with self.assertRaises(ValidationError):
            tc.full_clean()

    def test_teacher_assignment_within_range_valid(self):
        tc = TeacherClass(
            assigned_class=self.cls,
            teacher=self.teacher,
            assigned_at=self.cls.start_date,
        )
        tc.full_clean()  # should not raise


class ClassScheduleModelTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Schedule Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_duration=timedelta(hours=2),
        )

    def test_schedule_creation_computes_end_time(self):
        schedule = ClassSchedule.objects.create(
            class_obj=self.cls, day_of_week=0, start_time=time(10, 0)
        )
        self.assertEqual(schedule.end_time, time(12, 0))

    def test_schedule_str(self):
        schedule = ClassSchedule.objects.create(
            class_obj=self.cls, day_of_week=0, start_time=time(10, 0)
        )
        self.assertIn(self.cls.name, str(schedule))

    def test_schedule_duplicate_slot_rejected(self):
        ClassSchedule.objects.create(
            class_obj=self.cls, day_of_week=0, start_time=time(10, 0)
        )
        with self.assertRaises(Exception):
            ClassSchedule.objects.create(
                class_obj=self.cls, day_of_week=0, start_time=time(10, 0)
            )

    def test_schedule_requires_session_duration(self):
        cls_no_duration = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="No Duration",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        schedule = ClassSchedule(
            class_obj=cls_no_duration, day_of_week=1, start_time=time(9, 0)
        )
        with self.assertRaises(ValidationError):
            schedule.full_clean()


class ClassSessionEnrollmentModelTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Session Link",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        self.session = ClassSession.objects.create(
            session_date=date.today(), session_time=time(10, 0)
        )

    def test_session_link_creation(self):
        link = ClassSessionEnrollment.objects.create(
            class_obj=self.cls, session=self.session, session_num=1
        )
        self.assertEqual(link.session_num, 1)

    def test_session_link_str(self):
        link = ClassSessionEnrollment.objects.create(
            class_obj=self.cls, session=self.session, session_num=1
        )
        self.assertIn("#1", str(link))

    def test_session_num_must_be_positive(self):
        link = ClassSessionEnrollment(
            class_obj=self.cls, session=self.session, session_num=0
        )
        with self.assertRaises(ValidationError):
            link.full_clean()

    def test_unique_session_per_class(self):
        ClassSessionEnrollment.objects.create(
            class_obj=self.cls, session=self.session, session_num=1
        )
        with self.assertRaises(Exception):
            ClassSessionEnrollment.objects.create(
                class_obj=self.cls, session=self.session, session_num=2
            )

    def test_unique_session_num_per_class(self):
        ClassSessionEnrollment.objects.create(
            class_obj=self.cls, session=self.session, session_num=1
        )
        second_session = ClassSession.objects.create(
            session_date=date.today() + timedelta(days=1), session_time=time(10, 0)
        )
        with self.assertRaises(Exception):
            ClassSessionEnrollment.objects.create(
                class_obj=self.cls, session=second_session, session_num=1
            )


# =========================================================
# SERIALIZERS
# =========================================================

class SubjectSerializerTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_subject_list_serializer_fields(self):
        # classes_count requires annotation to be present
        subject = Subject.objects.filter(id=self.subject.id).annotate(
            **{}
        ).first()
        from django.db.models import Count
        annotated_subject = Subject.objects.annotate(
            classes_count=Count("classes")
        ).get(id=self.subject.id)
        data = SubjectListSerializer(
            annotated_subject, context={"request": None}
        ).data
        self.assertEqual(data["name"], "Math")
        self.assertEqual(data["classes_count"], 0)


class ClassCreateSerializerTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    class _FakeRequest:
        def __init__(self, user):
            self.user = user

    def test_validates_subject_belongs_to_same_academy(self):
        other_academy = create_academy(email=f"other-{id(self)}@test.com")
        other_user = create_user(other_academy, User.Roles.OWNER, f"otherowner-{id(self)}@test.com")

        serializer = ClassCreateSerializer(
            data={
                "subject": self.subject.id,
                "name": "Cross Academy",
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=30)),
            },
            context={"request": self._FakeRequest(other_user)},
        )
        self.assertFalse(serializer.is_valid())

    def test_create_assigns_academy_and_teachers(self):
        owner = create_user(self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com")
        serializer = ClassCreateSerializer(
            data={
                "subject": self.subject.id,
                "name": "New Class",
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=30)),
                "teachers": [str(self.teacher.id)],
            },
            context={"request": self._FakeRequest(owner)},
        )
        serializer.is_valid(raise_exception=True)
        cls = serializer.save()

        self.assertEqual(cls.academy, self.academy)
        self.assertTrue(
            TeacherClass.objects.filter(assigned_class=cls, teacher=self.teacher).exists()
        )


# =========================================================
# API / VIEWS
# =========================================================

class SubjectApiTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com")
        self.client.force_authenticate(self.owner)

    def test_subject_list(self):
        response = self.client.get("/api/subjects/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_subject_detail(self):
        response = self.client.get(f"/api/subjects/{self.subject.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Math")

    def test_create_subject(self):
        response = self.client.post(
            "/api/subjects/",
            {"name": "Chemistry", "description": "Chem"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_create_duplicate_subject_rejected(self):
        response = self.client.post(
            "/api/subjects/",
            {"name": "Math", "description": "dup"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_update_subject(self):
        response = self.client.patch(
            f"/api/subjects/{self.subject.id}/",
            {"name": "Advanced Math", "description": "updated"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.subject.refresh_from_db()
        self.assertEqual(self.subject.name, "Advanced Math")

    def test_delete_subject(self):
        response = self.client.delete(f"/api/subjects/{self.subject.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Subject.objects.filter(id=self.subject.id).exists())


class ClassApiTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com")
        self.client.force_authenticate(self.owner)

    def test_create_class(self):
        response = self.client.post(
            "/api/classes/",
            {
                "subject": self.subject.id,
                "name": "Class API",
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=30)),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Class.objects.count(), 1)

    def test_class_list(self):
        Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Listed Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        response = self.client.get("/api/classes/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_class_retrieve_detail(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Detail Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        response = self.client.get(f"/api/classes/{cls.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Detail Class")

    def test_assign_teacher_to_class(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Assign Teacher Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        response = self.client.post(
            f"/api/classes/{cls.id}/assign_teacher/",
            {"teacher_id": str(self.teacher.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            TeacherClass.objects.filter(assigned_class=cls, teacher=self.teacher).exists()
        )

    def test_assign_teacher_requires_teacher_id(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="No Teacher Id",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        response = self.client.post(
            f"/api/classes/{cls.id}/assign_teacher/", {}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_assign_teacher_duplicate_rejected(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Dup Teacher",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        TeacherClass.objects.create(
            assigned_class=cls, teacher=self.teacher, assigned_at=date.today()
        )
        response = self.client.post(
            f"/api/classes/{cls.id}/assign_teacher/",
            {"teacher_id": str(self.teacher.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_remove_teacher_from_class(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Remove Teacher",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        TeacherClass.objects.create(
            assigned_class=cls, teacher=self.teacher, assigned_at=date.today()
        )
        response = self.client.delete(
            f"/api/classes/{cls.id}/remove_teacher/",
            {"teacher_id": str(self.teacher.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            TeacherClass.objects.filter(assigned_class=cls, teacher=self.teacher).exists()
        )

    def test_remove_teacher_not_found(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Remove Missing Teacher",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        response = self.client.delete(
            f"/api/classes/{cls.id}/remove_teacher/",
            {"teacher_id": str(self.teacher.id)},
            format="json",
        )
        self.assertEqual(response.status_code, 404)


class ClassScheduleApiTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com")
        self.client.force_authenticate(self.owner)
        self.cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Scheduled Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_duration=timedelta(hours=1, minutes=30),
        )

    def test_schedule_list(self):
        response = self.client.get("/api/class-schedule/")
        self.assertEqual(response.status_code, 200)

    def test_create_schedule(self):
        response = self.client.post(
            "/api/class-schedule/",
            {
                "class_obj": str(self.cls.id),
                "day_of_week": 1,
                "start_time": "09:00:00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassSchedule.objects.count(), 1)

    def test_filter_schedule_by_class(self):
        ClassSchedule.objects.create(
            class_obj=self.cls, day_of_week=1, start_time=time(9, 0)
        )
        response = self.client.get(
            f"/api/class-schedule/?class_id={self.cls.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)


class ClassSessionEnrollmentApiTests(StructureTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com")
        self.client.force_authenticate(self.owner)
        self.cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Session Enrollment Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )
        self.session = ClassSession.objects.create(
            session_date=date.today(), session_time=time(10, 0)
        )
        ClassSessionEnrollment.objects.create(
            class_obj=self.cls, session=self.session, session_num=1
        )

    def test_session_enrollment_list(self):
        response = self.client.get("/api/class-session-enrollments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_session_enrollment_is_read_only(self):
        response = self.client.post(
            "/api/class-session-enrollments/",
            {
                "class_obj": str(self.cls.id),
                "session": str(self.session.id),
                "session_num": 2,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 405)

    def test_filter_session_enrollment_by_class(self):
        response = self.client.get(
            f"/api/class-session-enrollments/?class_id={self.cls.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)