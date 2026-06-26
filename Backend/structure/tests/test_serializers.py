from datetime import date, time, timedelta

from django.test import TestCase, RequestFactory

from core.models import Academy, User
from financial_operations.models import Teachers
from records.models import ClassSession
from structure.models import Class, ClassSchedule, ClassSessionEnrollment, Subject, TeacherClass
from structure.serializers import (
    ClassCreateSerializer,
    ClassDetailSerializer,
    ClassListSerializer,
    ClassScheduleSerializer,
    ClassSessionEnrollmentSerializer,
    ClassUpdateSerializer,
    SubjectCreateSerializer,
    SubjectDetailSerializer,
    SubjectListSerializer,
    SubjectUpdateSerializer,
    TeacherClassDetailSerializer,
)


class SubjectCreateSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.owner = User.objects.create_user(
            email="owner@test.com",
            password="pass",
            full_name="Owner",
            role="O",
            phone="0000000000",
            academy=cls.academy,
        )
        cls.factory = RequestFactory()

    def _request(self):
        request = self.factory.post("/")
        request.user = self.owner
        return request

    def test_valid_data_creates_subject(self):
        serializer = SubjectCreateSerializer(
            data={"name": "Math", "description": "Mathematics"},
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subject = serializer.save()
        self.assertEqual(subject.name, "Math")
        self.assertEqual(subject.academy, self.academy)

    def test_duplicate_name_same_academy_invalid(self):
        Subject.objects.create(
            academy=self.academy,
            name="Physics",
            description="Physics subject",
        )
        serializer = SubjectCreateSerializer(
            data={"name": "Physics", "description": "Another Physics"},
            context={"request": self._request()},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_missing_name_invalid(self):
        serializer = SubjectCreateSerializer(
            data={"description": "No name here"},
            context={"request": self._request()},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_academy_is_set_from_request_not_payload(self):
        # Even if a different academy_id were somehow passed, it comes from request.user
        serializer = SubjectCreateSerializer(
            data={"name": "Chemistry", "description": "Chem"},
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subject = serializer.save()
        self.assertEqual(subject.academy, self.academy)


class SubjectUpdateSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.owner = User.objects.create_user(
            email="owner@test.com",
            password="pass",
            full_name="Owner",
            role="O",
            phone="0000000000",
            academy=cls.academy,
        )
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )
        cls.factory = RequestFactory()

    def _request(self):
        request = self.factory.patch("/")
        request.user = self.owner
        return request

    def test_valid_rename(self):
        serializer = SubjectUpdateSerializer(
            instance=self.subject,
            data={"name": "Advanced Math", "description": "Mathematics"},
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_same_name_on_same_instance_is_valid(self):
        # Updating other fields while keeping the same name should pass
        serializer = SubjectUpdateSerializer(
            instance=self.subject,
            data={"name": "Math", "description": "Updated description"},
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_rename_to_existing_name_invalid(self):
        Subject.objects.create(
            academy=self.academy,
            name="Physics",
            description="Physics",
        )
        serializer = SubjectUpdateSerializer(
            instance=self.subject,
            data={"name": "Physics", "description": "Mathematics"},
            context={"request": self._request()},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)


class SubjectListSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )

    def test_fields_present(self):
        # classes_count is an annotated field; supply it manually
        cls_subject = type(
            "AnnotatedSubject",
            (),
            {
                **self.subject.__dict__,
                "academy": self.academy,
                "classes_count": 3,
            },
        )
        # Simpler: just verify the serializer accepts the model instance for non-annotated fields
        data = SubjectListSerializer(self.subject, context={"request": None}).data
        for field in ["id", "academy", "academy_name", "name", "description"]:
            self.assertIn(field, data)

    def test_academy_name_value(self):
        data = SubjectListSerializer(self.subject, context={"request": None}).data
        self.assertEqual(data["academy_name"], "Test Academy")


class SubjectDetailSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )
        cls.cls = Class.objects.create(
            academy=cls.academy,
            subject=cls.subject,
            name="Class A",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=10,
            session_price="100.00",
            session_duration=timedelta(hours=1),
        )

    def test_classes_nested(self):
        data = SubjectDetailSerializer(self.subject, context={"request": None}).data
        self.assertIn("classes", data)
        self.assertEqual(len(data["classes"]), 1)
        self.assertEqual(data["classes"][0]["name"], "Class A")

    def test_academy_name_value(self):
        data = SubjectDetailSerializer(self.subject, context={"request": None}).data
        self.assertEqual(data["academy_name"], "Test Academy")


class ClassCreateSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.owner = User.objects.create_user(
            email="owner@test.com",
            password="pass",
            full_name="Owner",
            role="O",
            phone="0000000000",
            academy=cls.academy,
        )
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )
        teacher_user = User.objects.create_user(
            email="teacher@test.com",
            password="pass",
            full_name="Teacher One",
            role="T",
            phone="0000000000",
            academy=cls.academy,
        )
        cls.teacher = Teachers.objects.create(
            academy_id=cls.academy,
            user_id=teacher_user,
        )
        cls.factory = RequestFactory()

    def _request(self):
        request = self.factory.post("/")
        request.user = self.owner
        return request

    def _valid_payload(self, **overrides):
        payload = {
            "subject": self.subject.id,
            "name": "Morning Class",
            "start_date": date(2025, 1, 1),
            "end_date": date(2025, 6, 30),
            "session_count": 10,
            "session_price": "100.00",
            "session_duration": timedelta(hours=1),
        }
        payload.update(overrides)
        return payload

    def test_valid_payload_creates_class(self):
        serializer = ClassCreateSerializer(
            data=self._valid_payload(),
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        cls = serializer.save()
        self.assertEqual(cls.name, "Morning Class")
        self.assertEqual(cls.academy, self.academy)

    def test_creates_teacher_assignments(self):
        serializer = ClassCreateSerializer(
            data=self._valid_payload(teachers=[self.teacher.id]),
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        cls = serializer.save()
        self.assertEqual(cls.teacher_assignments.count(), 1)
        self.assertEqual(cls.teacher_assignments.first().teacher, self.teacher)

    def test_teacher_assigned_at_equals_start_date(self):
        serializer = ClassCreateSerializer(
            data=self._valid_payload(teachers=[self.teacher.id]),
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        cls = serializer.save()
        self.assertEqual(
            cls.teacher_assignments.first().assigned_at,
            date(2025, 1, 1),
        )

    def test_subject_from_different_academy_invalid(self):
        other_academy = Academy.objects.create(
            name="Other Academy",
            email="other@test.com",
            phone="0000000000",
        )
        foreign_subject = Subject.objects.create(
            academy=other_academy,
            name="Math",
            description="Foreign Math",
        )
        serializer = ClassCreateSerializer(
            data=self._valid_payload(subject=foreign_subject.id),
            context={"request": self._request()},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_missing_required_fields_invalid(self):
        serializer = ClassCreateSerializer(
            data={"name": "Incomplete"},
            context={"request": self._request()},
        )
        self.assertFalse(serializer.is_valid())
        for field in ["subject", "start_date", "end_date"]:
            self.assertIn(field, serializer.errors)

    def test_no_teachers_field_is_optional(self):
        serializer = ClassCreateSerializer(
            data=self._valid_payload(),  # no teachers key
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        cls = serializer.save()
        self.assertEqual(cls.teacher_assignments.count(), 0)


class ClassUpdateSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.owner = User.objects.create_user(
            email="owner@test.com",
            password="pass",
            full_name="Owner",
            role="O",
            phone="0000000000",
            academy=cls.academy,
        )
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )
        cls.cls = Class.objects.create(
            academy=cls.academy,
            subject=cls.subject,
            name="Class A",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=10,
            session_price="100.00",
            session_duration=timedelta(hours=1),
        )
        teacher_user_1 = User.objects.create_user(
            email="teacher1@test.com",
            password="pass",
            full_name="Teacher One",
            role="T",
            phone="0000000000",
            academy=cls.academy,
        )
        teacher_user_2 = User.objects.create_user(
            email="teacher2@test.com",
            password="pass",
            full_name="Teacher Two",
            role="T",
            phone="0000000000",
            academy=cls.academy,
        )
        cls.teacher1 = Teachers.objects.create(academy_id=cls.academy, user_id=teacher_user_1)
        cls.teacher2 = Teachers.objects.create(academy_id=cls.academy, user_id=teacher_user_2)
        TeacherClass.objects.create(
            assigned_class=cls.cls,
            teacher=cls.teacher1,
            assigned_at=date(2025, 1, 1),
        )
        cls.factory = RequestFactory()

    def _request(self):
        request = self.factory.patch("/")
        request.user = self.owner
        return request

    def _valid_payload(self, **overrides):
        payload = {
            "subject": self.subject.id,
            "name": "Class A",
            "start_date": date(2025, 1, 1),
            "end_date": date(2025, 6, 30),
            "session_count": 10,
            "session_price": "100.00",
            "session_duration": timedelta(hours=1),
        }
        payload.update(overrides)
        return payload

    def test_valid_update(self):
        serializer = ClassUpdateSerializer(
            instance=self.cls,
            data=self._valid_payload(name="Evening Class"),
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.name, "Evening Class")

    def test_add_new_teacher(self):
        serializer = ClassUpdateSerializer(
            instance=self.cls,
            data=self._valid_payload(teachers=[self.teacher1.id, self.teacher2.id]),
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.assertEqual(self.cls.teacher_assignments.count(), 2)

    def test_remove_teacher(self):
        # Pass only teacher2 — teacher1 should be removed
        serializer = ClassUpdateSerializer(
            instance=self.cls,
            data=self._valid_payload(teachers=[self.teacher2.id]),
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        remaining = list(self.cls.teacher_assignments.values_list("teacher_id", flat=True))
        self.assertNotIn(self.teacher1.id, remaining)
        self.assertIn(self.teacher2.id, remaining)

    def test_omitting_teachers_field_leaves_assignments_unchanged(self):
        serializer = ClassUpdateSerializer(
            instance=self.cls,
            data=self._valid_payload(),  # no teachers key
            context={"request": self._request()},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        # teacher1 assignment should still be there
        self.assertEqual(self.cls.teacher_assignments.count(), 1)

    def test_subject_from_different_academy_invalid(self):
        other_academy = Academy.objects.create(
            name="Other Academy",
            email="other@test.com",
            phone="0000000000",
        )
        foreign_subject = Subject.objects.create(
            academy=other_academy,
            name="Math",
            description="Foreign",
        )
        serializer = ClassUpdateSerializer(
            instance=self.cls,
            data=self._valid_payload(subject=foreign_subject.id),
            context={"request": self._request()},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)


class ClassScheduleSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )
        cls.cls = Class.objects.create(
            academy=cls.academy,
            subject=cls.subject,
            name="Class A",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=10,
            session_price="100.00",
            session_duration=timedelta(hours=1, minutes=30),
        )
        cls.schedule = ClassSchedule.objects.create(
            class_obj=cls.cls,
            day_of_week=0,
            start_time=time(9, 0),
        )

    def test_end_time_is_read_only(self):
        data = ClassScheduleSerializer(self.schedule).data
        self.assertEqual(data["end_time"], "10:30:00")

    def test_day_of_week_display(self):
        data = ClassScheduleSerializer(self.schedule).data
        self.assertEqual(data["day_of_week_display"], "Monday")

    def test_class_obj_is_read_only(self):
        # class_obj in read_only_fields — should appear in output but be ignored on input
        data = ClassScheduleSerializer(self.schedule).data
        self.assertIn("class_obj", data)


class ClassSessionEnrollmentSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )
        cls.cls = Class.objects.create(
            academy=cls.academy,
            subject=cls.subject,
            name="Class A",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=10,
            session_price="100.00",
            session_duration=timedelta(hours=1),
        )
        cls.session = ClassSession.objects.create(
            session_date=date(2025, 2, 1),
            session_time=time(9, 0),
            notes="First session",
        )
        cls.link = ClassSessionEnrollment.objects.create(
            class_obj=cls.cls,
            session=cls.session,
            session_num=1,
        )

    def test_session_date_from_related_session(self):
        data = ClassSessionEnrollmentSerializer(self.link).data
        self.assertEqual(data["session_date"], "2025-02-01")

    def test_notes_from_related_session(self):
        data = ClassSessionEnrollmentSerializer(self.link).data
        self.assertEqual(data["notes"], "First session")

    def test_class_obj_and_session_num_are_read_only(self):
        data = ClassSessionEnrollmentSerializer(self.link).data
        self.assertIn("class_obj", data)
        self.assertIn("session_num", data)


class TeacherClassDetailSerializerTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="0000000000",
        )
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )
        cls.cls = Class.objects.create(
            academy=cls.academy,
            subject=cls.subject,
            name="Class A",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=10,
            session_price="100.00",
            session_duration=timedelta(hours=1),
        )
        teacher_user = User.objects.create_user(
            email="teacher@test.com",
            password="pass",
            full_name="Teacher One",
            role="T",
            phone="0000000000",
            academy=cls.academy,
        )
        cls.teacher = Teachers.objects.create(
            academy_id=cls.academy,
            user_id=teacher_user,
        )
        cls.assignment = TeacherClass.objects.create(
            assigned_class=cls.cls,
            teacher=cls.teacher,
            assigned_at=date(2025, 1, 1),
        )

    def test_teacher_name_value(self):
        data = TeacherClassDetailSerializer(self.assignment).data
        self.assertEqual(data["teacher_name"], "Teacher One")

    def test_teacher_id_value(self):
        data = TeacherClassDetailSerializer(self.assignment).data
        self.assertEqual(str(data["teacher_id"]), str(self.teacher.id))

    def test_assigned_at_value(self):
        data = TeacherClassDetailSerializer(self.assignment).data
        self.assertEqual(data["assigned_at"], "2025-01-01")