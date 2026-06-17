from datetime import date, timedelta, time

from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from core.models import Academy, User
from structure.models import (
    Subject,
    Class,
    TeacherClass,
    ClassSchedule,
    ClassSessionEnrollment,
)
from financial_operations.models import Teachers
from records.models import ClassSession


class StructureModelTests(TestCase):

    def setUp(self):
        self.academy = Academy.objects.create(
            name="Academy",
            email="academy@test.com",
            phone="01000000000",
            subscription_end=date.today() + timedelta(days=30)
        )

        self.teacher_user = User.objects.create_user(
            email="teacher@test.com",
            password="123456",
            academy=self.academy,
            full_name="Teacher",
            phone="0100",
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
            name="Math",
            description="Math"
        )

    def test_subject_creation(self):
        self.assertEqual(self.subject.name, "Math")

    def test_subject_unique_per_academy(self):
        with self.assertRaises(Exception):
            Subject.objects.create(
                academy=self.academy,
                name="Math",
                description="duplicate"
            )

    def test_class_creation(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class A",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30)
        )

        self.assertEqual(cls.name, "Class A")

    def test_class_invalid_dates(self):
        cls = Class(
            academy=self.academy,
            subject=self.subject,
            name="Invalid",
            start_date=date.today(),
            end_date=date.today()
        )

        with self.assertRaises(ValidationError):
            cls.full_clean()

    def test_class_price_property(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Price Class",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_count=20,
            session_price=100
        )

        self.assertEqual(cls.class_price, 2000)

    def test_teacher_assignment(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Assignment",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30)
        )

        tc = TeacherClass.objects.create(
            assigned_class=cls,
            teacher=self.teacher,
            assigned_at=date.today()
        )

        self.assertEqual(tc.teacher, self.teacher)

    def test_teacher_duplicate_assignment(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Dup",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30)
        )

        TeacherClass.objects.create(
            assigned_class=cls,
            teacher=self.teacher,
            assigned_at=date.today()
        )

        with self.assertRaises(Exception):
            TeacherClass.objects.create(
                assigned_class=cls,
                teacher=self.teacher,
                assigned_at=date.today()
            )

    def test_teacher_assignment_before_start(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Before",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=10)
        )

        tc = TeacherClass(
            assigned_class=cls,
            teacher=self.teacher,
            assigned_at=date.today() - timedelta(days=1)
        )

        with self.assertRaises(ValidationError):
            tc.full_clean()

    def test_teacher_assignment_after_end(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="After",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=5)
        )

        tc = TeacherClass(
            assigned_class=cls,
            teacher=self.teacher,
            assigned_at=date.today() + timedelta(days=10)
        )

        with self.assertRaises(ValidationError):
            tc.full_clean()

    def test_schedule_creation(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Schedule",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_duration=timedelta(hours=2)
        )

        schedule = ClassSchedule.objects.create(
            class_obj=cls,
            day_of_week=0,
            start_time=time(10, 0)
        )

        self.assertEqual(schedule.end_time, time(12, 0))

    def test_schedule_duplicate(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Dup Schedule",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_duration=timedelta(hours=2)
        )

        ClassSchedule.objects.create(
            class_obj=cls,
            day_of_week=0,
            start_time=time(10, 0)
        )

        with self.assertRaises(Exception):
            ClassSchedule.objects.create(
                class_obj=cls,
                day_of_week=0,
                start_time=time(10, 0)
            )

    def test_session_link_creation(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Session Link",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30)
        )

        session = ClassSession.objects.create(
            session_date=date.today(),
            session_time=time(10, 0)
        )

        link = ClassSessionEnrollment.objects.create(
            class_obj=cls,
            session=session,
            session_num=1
        )

        self.assertEqual(link.session_num, 1)

    def test_session_num_positive(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Session Num",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30)
        )

        session = ClassSession.objects.create(
            session_date=date.today(),
            session_time=time(11, 0)
        )

        link = ClassSessionEnrollment(
            class_obj=cls,
            session=session,
            session_num=0
        )

        with self.assertRaises(ValidationError):
            link.full_clean()


class StructureAPITests(TestCase):

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
            phone="0100",
            parent_phone="",
            educational_level=18,
            role=User.Roles.OWNER
        )

        self.client.force_authenticate(self.owner)

        self.subject = Subject.objects.create(
            academy=self.academy,
            name="Physics",
            description="Physics"
        )

    def test_subject_list(self):
        response = self.client.get("/api/subjects/")
        self.assertEqual(response.status_code, 200)

    def test_subject_detail(self):
        response = self.client.get(
            f"/api/subjects/{self.subject.id}/"
        )
        self.assertEqual(response.status_code, 200)

    def test_create_subject(self):
        response = self.client.post(
            "/api/subjects/",
            {
                "academy": self.academy.id,
                "name": "Chemistry",
                "description": "Chem"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 201)

    def test_create_class(self):

        response = self.client.post(
            "/api/classes/",
            {
                "academy": self.academy.id,
                "subject": self.subject.id,
                "name": "Class API",
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=30))
            },
            format="json"
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Class.objects.count(), 1)

    def test_class_list(self):
        response = self.client.get("/api/classes/")
        self.assertEqual(response.status_code, 200)

    def test_schedule_list(self):
        response = self.client.get("/api/class-schedule/")
        self.assertEqual(response.status_code, 200)
    def test_session_enrollment_list(self):
        response = self.client.get(
            "/api/class-session-enrollments/"
        )
        self.assertEqual(response.status_code, 200)