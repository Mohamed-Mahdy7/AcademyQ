from datetime import date, time, timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase

from core.models import Academy, User
from financial_operations.models import Teachers
from records.models import ClassSession
from structure.models import (
    Class,
    ClassSchedule,
    ClassSessionEnrollment,
    Subject,
    TeacherClass,
)


class SubjectModelTest(TestCase):

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
            description="A test subject",
        )

    def test_str(self):
        self.assertEqual(str(self.subject), "Math")

    def test_academy_relation(self):
        self.assertEqual(self.subject.academy, self.academy)

    def test_duplicate_name_same_academy_raises(self):
        with self.assertRaises(Exception):
            Subject.objects.create(
                academy=self.academy,
                name="Math",
                description="Duplicate",
            )

    def test_same_name_different_academies_allowed(self):
        academy2 = Academy.objects.create(
            name="Another Academy",
            email="other@test.com",
            phone="0000000000",
        )
        subject2 = Subject.objects.create(
            academy=academy2,
            name="Math",
            description="Same name, different academy",
        )
        self.assertEqual(self.subject.name, subject2.name)
        self.assertNotEqual(self.subject.academy, subject2.academy)


class ClassModelTest(TestCase):

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
            description="A test subject",
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

    def test_str(self):
        self.assertEqual(str(self.cls), "Class A")

    def test_class_price_property(self):
        # 10 sessions × 100.00 = 1000
        self.assertEqual(self.cls.class_price, 1000)

    def test_class_price_zero_sessions(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Zero Sessions Class",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=0,
            session_price="100.00",
            session_duration=timedelta(hours=1),
        )
        self.assertEqual(cls.class_price, 0)

    def test_end_date_before_start_date_raises(self):
        with self.assertRaises(ValidationError) as ctx:
            Class.objects.create(
                academy=self.academy,
                subject=self.subject,
                name="Bad Dates Class",
                start_date=date(2025, 6, 1),
                end_date=date(2025, 1, 1),
                session_count=10,
                session_price="100.00",
                session_duration=timedelta(hours=1),
            )
        self.assertIn("end_date", ctx.exception.message_dict)

    def test_end_date_equal_to_start_date_raises(self):
        with self.assertRaises(ValidationError):
            Class.objects.create(
                academy=self.academy,
                subject=self.subject,
                name="Equal Dates Class",
                start_date=date(2025, 3, 1),
                end_date=date(2025, 3, 1),
                session_count=10,
                session_price="100.00",
                session_duration=timedelta(hours=1),
            )

    def test_duplicate_name_same_subject_and_academy_raises(self):
        with self.assertRaises(Exception):
            Class.objects.create(
                academy=self.academy,
                subject=self.subject,
                name="Class A",
                start_date=date(2025, 1, 1),
                end_date=date(2025, 6, 30),
                session_count=5,
                session_price="50.00",
                session_duration=timedelta(hours=1),
            )

    def test_same_name_different_subjects_allowed(self):
        subject2 = Subject.objects.create(
            academy=self.academy,
            name="Physics",
            description="Another subject",
        )
        cls2 = Class.objects.create(
            academy=self.academy,
            subject=subject2,
            name="Class A",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=10,
            session_price="100.00",
            session_duration=timedelta(hours=1),
        )
        self.assertEqual(self.cls.name, cls2.name)
        self.assertNotEqual(self.cls.subject, cls2.subject)


class ClassScheduleModelTest(TestCase):

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
            description="A test subject",
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

    def test_end_time_auto_computed(self):
        # 09:00 + 1h30m = 10:30
        schedule = ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=0,
            start_time=time(9, 0),
        )
        self.assertEqual(schedule.end_time, time(10, 30))

    def test_end_time_crosses_midnight(self):
        # 23:00 + 1h30m = 00:30
        schedule = ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=1,
            start_time=time(23, 0),
        )
        self.assertEqual(schedule.end_time, time(0, 30))

    def test_str(self):
        schedule = ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=0,
            start_time=time(8, 0),
        )
        self.assertIn("Monday", str(schedule))
        self.assertIn(self.cls.name, str(schedule))

    def test_duplicate_slot_raises(self):
        ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=2,
            start_time=time(10, 0),
        )
        with self.assertRaises(Exception):
            ClassSchedule.objects.create(
                class_obj=self.cls,
                day_of_week=2,
                start_time=time(10, 0),
            )

    def test_same_day_different_times_allowed(self):
        s1 = ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=3,
            start_time=time(8, 0),
        )
        s2 = ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=3,
            start_time=time(12, 0),
        )
        self.assertNotEqual(s1.pk, s2.pk)

    def test_same_time_different_days_allowed(self):
        s1 = ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=4,
            start_time=time(9, 0),
        )
        s2 = ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=5,
            start_time=time(9, 0),
        )
        self.assertNotEqual(s1.pk, s2.pk)


class ClassSessionEnrollmentModelTest(TestCase):

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
            description="A test subject",
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
        )

    def test_str(self):
        link = ClassSessionEnrollment.objects.create(
            class_obj=self.cls,
            session=self.session,
            session_num=1,
        )
        self.assertEqual(str(link), f"{self.cls.name} — Session #1")

    def test_session_num_zero_raises(self):
        with self.assertRaises(ValidationError) as ctx:
            ClassSessionEnrollment.objects.create(
                class_obj=self.cls,
                session=self.session,
                session_num=0,
            )
        self.assertIn("session_num", ctx.exception.message_dict)

    def test_session_num_negative_raises(self):
        with self.assertRaises(ValidationError):
            ClassSessionEnrollment.objects.create(
                class_obj=self.cls,
                session=self.session,
                session_num=-3,
            )

    def test_duplicate_session_per_class_raises(self):
        session2 = ClassSession.objects.create(
            session_date=date(2025, 3, 1),
            session_time=time(10, 0),
        )
        ClassSessionEnrollment.objects.create(
            class_obj=self.cls,
            session=session2,
            session_num=1,
        )
        with self.assertRaises(Exception):
            ClassSessionEnrollment.objects.create(
                class_obj=self.cls,
                session=session2,
                session_num=2,
            )

    def test_duplicate_session_num_per_class_raises(self):
        session3 = ClassSession.objects.create(
            session_date=date(2025, 4, 1),
            session_time=time(11, 0),
        )
        session4 = ClassSession.objects.create(
            session_date=date(2025, 4, 2),
            session_time=time(11, 0),
        )
        ClassSessionEnrollment.objects.create(
            class_obj=self.cls,
            session=session3,
            session_num=5,
        )
        with self.assertRaises(Exception):
            ClassSessionEnrollment.objects.create(
                class_obj=self.cls,
                session=session4,
                session_num=5,
            )

    def test_same_session_num_different_classes_allowed(self):
        cls2 = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class B",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=10,
            session_price="100.00",
            session_duration=timedelta(hours=1),
        )
        session5 = ClassSession.objects.create(
            session_date=date(2025, 5, 1),
            session_time=time(14, 0),
        )
        session6 = ClassSession.objects.create(
            session_date=date(2025, 5, 2),
            session_time=time(14, 0),
        )
        l1 = ClassSessionEnrollment.objects.create(
            class_obj=self.cls,
            session=session5,
            session_num=3,
        )
        l2 = ClassSessionEnrollment.objects.create(
            class_obj=cls2,
            session=session6,
            session_num=3,
        )
        self.assertEqual(l1.session_num, l2.session_num)
        self.assertNotEqual(l1.class_obj, l2.class_obj)


class TeacherClassModelTest(TestCase):

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
            description="A test subject",
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
            academy=cls.academy,
            full_name="Teacher One",
            role="T",
            phone="0000000000",
        )
        cls.teacher = Teachers.objects.create(
            academy_id=cls.academy,
            user_id=teacher_user,
        )

    def test_str(self):
        ta = TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=self.teacher,
            assigned_at=date(2025, 3, 1),
        )
        self.assertIn(self.cls.name, str(ta))

    def test_assigned_at_on_start_date_is_valid(self):
        ta = TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=self.teacher,
            assigned_at=date(2025, 1, 1),
        )
        self.assertIsNotNone(ta.pk)

    def test_assigned_at_on_end_date_is_valid(self):
        # Need a fresh teacher since unique_teacher_per_class would fire otherwise
        user2 = User.objects.create_user(
            email="teacher2@test.com",
            password="pass",
            academy=self.academy,
            full_name="Teacher Two",
            role="T",
            phone="0000000000",
        )
        teacher2 = Teachers.objects.create(academy_id=self.academy, user_id=user2)
        ta = TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=teacher2,
            assigned_at=date(2025, 6, 30),
        )
        self.assertIsNotNone(ta.pk)

    def test_assigned_at_before_start_date_raises(self):
        user3 = User.objects.create_user(
            email="teacher3@test.com",
            password="pass",
            academy=self.academy,
            full_name="Teacher Three",
            role="T",
            phone="0000000000",
        )
        teacher3 = Teachers.objects.create(academy_id=self.academy, user_id=user3)
        with self.assertRaises(ValidationError) as ctx:
            TeacherClass.objects.create(
                assigned_class=self.cls,
                teacher=teacher3,
                assigned_at=date(2024, 12, 31),
            )
        self.assertIn("assigned_at", ctx.exception.message_dict)

    def test_assigned_at_after_end_date_raises(self):
        user4 = User.objects.create_user(
            email="teacher4@test.com",
            password="pass",
            academy=self.academy,
            full_name="Teacher Four",
            role="T",
            phone="0000000000",
        )
        teacher4 = Teachers.objects.create(academy_id=self.academy, user_id=user4)
        with self.assertRaises(ValidationError) as ctx:
            TeacherClass.objects.create(
                assigned_class=self.cls,
                teacher=teacher4,
                assigned_at=date(2025, 7, 1),
            )
        self.assertIn("assigned_at", ctx.exception.message_dict)

    def test_duplicate_teacher_per_class_raises(self):
        user5 = User.objects.create_user(
            email="teacher5@test.com",
            password="pass",
            academy=self.academy,
            full_name="Teacher Five",
            role="T",
            phone="0000000000",
        )
        teacher5 = Teachers.objects.create(academy_id=self.academy, user_id=user5)
        TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=teacher5,
            assigned_at=date(2025, 3, 1),
        )
        with self.assertRaises(Exception):
            TeacherClass.objects.create(
                assigned_class=self.cls,
                teacher=teacher5,
                assigned_at=date(2025, 4, 1),
            )

    def test_same_teacher_different_classes_allowed(self):
        user6 = User.objects.create_user(
            email="teacher6@test.com",
            password="pass",
            academy=self.academy,
            full_name="Teacher Six",
            role="T",
            phone="0000000000",
        )
        teacher6 = Teachers.objects.create(academy_id=self.academy, user_id=user6)
        cls2 = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class B",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=10,
            session_price="100.00",
            session_duration=timedelta(hours=1),
        )
        ta1 = TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=teacher6,
            assigned_at=date(2025, 3, 1),
        )
        ta2 = TeacherClass.objects.create(
            assigned_class=cls2,
            teacher=teacher6,
            assigned_at=date(2025, 3, 1),
        )
        self.assertEqual(ta1.teacher, ta2.teacher)
        self.assertNotEqual(ta1.assigned_class, ta2.assigned_class)

    def test_different_teachers_same_class_allowed(self):
        user7 = User.objects.create_user(
            email="teacher7@test.com",
            password="pass",
            academy=self.academy,
            full_name="Teacher Seven",
            role="T",
            phone="0000000000",
        )
        user8 = User.objects.create_user(
            email="teacher8@test.com",
            password="pass",
            academy=self.academy,
            full_name="Teacher Eight",
            role="T",
            phone="0000000000",
        )
        teacher7 = Teachers.objects.create(academy_id=self.academy, user_id=user7)
        teacher8 = Teachers.objects.create(academy_id=self.academy, user_id=user8)
        ta1 = TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=teacher7,
            assigned_at=date(2025, 3, 1),
        )
        ta2 = TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=teacher8,
            assigned_at=date(2025, 3, 1),
        )
        self.assertEqual(ta1.assigned_class, ta2.assigned_class)
        self.assertNotEqual(ta1.teacher, ta2.teacher)