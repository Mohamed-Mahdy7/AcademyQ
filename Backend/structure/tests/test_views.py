from datetime import date, time, timedelta

from django.test import TestCase
from unittest import expectedFailure
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

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


class BaseViewTest(TestCase):
    """
    Creates one academy with an owner user and an API client authenticated
    as that owner. Subclasses add the fixtures they need on top.
    """

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

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)


class SubjectViewSetTest(BaseViewTest):

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.subject = Subject.objects.create(
            academy=cls.academy,
            name="Math",
            description="Mathematics",
        )

    # --- list ---

    def test_list_returns_200(self):
        response = self.client.get(reverse("subject-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_contains_own_subject(self):
        response = self.client.get(reverse("subject-list"))
        ids = [s["id"] for s in response.data]
        self.assertIn(str(self.subject.id), ids)

    # --- retrieve ---

    def test_retrieve_returns_200(self):
        response = self.client.get(reverse("subject-detail", args=[self.subject.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_subject(self):
        response = self.client.get(reverse("subject-detail", args=[self.subject.id]))
        self.assertEqual(response.data["name"], "Math")

    # --- create ---

    def test_create_returns_201(self):
        response = self.client.post(
            reverse("subject-list"),
            {"name": "Physics", "description": "Physics subject"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_assigns_academy_from_request(self):
        self.client.post(
            reverse("subject-list"),
            {"name": "Chemistry", "description": "Chemistry subject"},
        )
        self.assertTrue(
            Subject.objects.filter(academy=self.academy, name="Chemistry").exists()
        )

    def test_create_duplicate_name_returns_400(self):
        response = self.client.post(
            reverse("subject-list"),
            {"name": "Math", "description": "Duplicate"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_name_returns_400(self):
        response = self.client.post(
            reverse("subject-list"),
            {"description": "No name"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- update ---

    def test_update_returns_200(self):
        response = self.client.put(
            reverse("subject-detail", args=[self.subject.id]),
            {"name": "Math", "description": "Updated description"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_rename_to_existing_returns_400(self):
        Subject.objects.create(
            academy=self.academy, name="Biology", description="Bio"
        )
        response = self.client.put(
            reverse("subject-detail", args=[self.subject.id]),
            {"name": "Biology", "description": "Renamed to existing"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- destroy ---

    def test_destroy_returns_204(self):
        subject = Subject.objects.create(
            academy=self.academy, name="Temp Subject", description="To delete"
        )
        response = self.client.delete(reverse("subject-detail", args=[subject.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Subject.objects.filter(id=subject.id).exists())

    # --- unauthenticated ---

    def test_unauthenticated_returns_401(self):
        self.client.logout()
        response = self.client.get(reverse("subject-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ClassViewSetTest(BaseViewTest):

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
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

    def _valid_payload(self, **overrides):
        payload = {
            "subject": str(self.subject.id),
            "name": "New Class",
            "start_date": "2025-01-01",
            "end_date": "2025-06-30",
            "session_count": 10,
            "session_price": "100.00",
            "session_duration": "01:00:00",
        }
        payload.update(overrides)
        return payload

    # --- list ---

    def test_list_returns_200(self):
        response = self.client.get(reverse("class-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_contains_own_class(self):
        response = self.client.get(reverse("class-list"))
        ids = [c["id"] for c in response.data]
        self.assertIn(str(self.cls.id), ids)

    # --- retrieve ---

    def test_retrieve_returns_200(self):
        response = self.client.get(reverse("class-detail", args=[self.cls.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_uses_detail_serializer_fields(self):
        response = self.client.get(reverse("class-detail", args=[self.cls.id]))
        # ClassDetailSerializer includes teachers and schedules; ClassListSerializer does not
        self.assertIn("teachers", response.data)
        self.assertIn("schedules", response.data)

    # --- create ---

    def test_create_returns_201(self):
        response = self.client.post(reverse("class-list"), self._valid_payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_assigns_academy_from_request(self):
        self.client.post(reverse("class-list"), self._valid_payload(name="Auto Academy Class"))
        self.assertTrue(
            Class.objects.filter(academy=self.academy, name="Auto Academy Class").exists()
        )

    def test_create_with_teacher_creates_assignment(self):
        response = self.client.post(
            reverse("class-list"),
            self._valid_payload(name="Assigned Class", teachers=[str(self.teacher.id)]),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cls = Class.objects.get(id=response.data["id"])
        self.assertEqual(cls.teacher_assignments.count(), 1)

    def test_create_foreign_subject_returns_400(self):
        other_academy = Academy.objects.create(
            name="Other Academy 2", email="other2@test.com", phone="0000000000"
        )
        foreign_subject = Subject.objects.create(
            academy=other_academy, name="Math", description="Foreign"
        )
        response = self.client.post(
            reverse("class-list"),
            self._valid_payload(subject=str(foreign_subject.id)),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- update ---

    def test_update_returns_200(self):
        response = self.client.put(
            reverse("class-detail", args=[self.cls.id]),
            self._valid_payload(name="Class A"),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_changes_name(self):
        self.client.put(
            reverse("class-detail", args=[self.cls.id]),
            self._valid_payload(name="Renamed Class"),
        )
        self.cls.refresh_from_db()
        self.assertEqual(self.cls.name, "Renamed Class")

    def test_update_teachers_adds_new_assignment(self):
        self.client.put(
            reverse("class-detail", args=[self.cls.id]),
            self._valid_payload(name="Class A", teachers=[str(self.teacher.id)]),
        )
        self.assertEqual(self.cls.teacher_assignments.count(), 1)

    # --- destroy ---

    def test_destroy_returns_204(self):
        cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Temp Class",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=5,
            session_price="50.00",
            session_duration=timedelta(hours=1),
        )
        response = self.client.delete(reverse("class-detail", args=[cls.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Class.objects.filter(id=cls.id).exists())

    # --- assign_teacher action ---

    def test_assign_teacher_returns_201(self):
        response = self.client.post(
            reverse("class-assign-teacher", args=[self.cls.id]),
            {"teacher_id": str(self.teacher.id)},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_assign_teacher_creates_assignment(self):
        self.client.post(
            reverse("class-assign-teacher", args=[self.cls.id]),
            {"teacher_id": str(self.teacher.id)},
        )
        self.assertTrue(
            TeacherClass.objects.filter(
                assigned_class=self.cls, teacher=self.teacher
            ).exists()
        )

    def test_assign_teacher_duplicate_returns_400(self):
        TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=self.teacher,
            assigned_at=date(2025, 1, 1),
        )
        response = self.client.post(
            reverse("class-assign-teacher", args=[self.cls.id]),
            {"teacher_id": str(self.teacher.id)},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- remove_teacher action ---

    def test_remove_teacher_returns_204(self):
        assignment = TeacherClass.objects.create(
            assigned_class=self.cls,
            teacher=self.teacher,
            assigned_at=date(2025, 1, 1),
        )
        response = self.client.delete(
            reverse("class-remove-teacher", args=[self.cls.id]),
            {"teacher_id": str(self.teacher.id)},
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TeacherClass.objects.filter(id=assignment.id).exists())

    # --- unauthenticated ---

    def test_unauthenticated_returns_401(self):
        self.client.logout()
        response = self.client.get(reverse("class-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ClassScheduleViewSetTest(BaseViewTest):

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
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

    # --- list ---

    def test_list_returns_200(self):
        response = self.client.get(reverse("class-schedule-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_contains_own_schedule(self):
        response = self.client.get(reverse("class-schedule-list"))
        ids = [s["id"] for s in response.data]
        self.assertIn(str(self.schedule.id), ids)

    def test_list_filter_by_class_id(self):
        other_cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class B",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=5,
            session_price="50.00",
            session_duration=timedelta(hours=1),
        )
        other_schedule = ClassSchedule.objects.create(
            class_obj=other_cls,
            day_of_week=2,
            start_time=time(10, 0),
        )
        response = self.client.get(
            reverse("class-schedule-list"), {"class_id": str(self.cls.id)}
        )
        ids = [s["id"] for s in response.data]
        self.assertIn(str(self.schedule.id), ids)
        self.assertNotIn(str(other_schedule.id), ids)

    def test_list_excludes_other_academy_schedules(self):
        other_academy = Academy.objects.create(
            name="Other Academy", email="other@test.com", phone="0000000000"
        )
        other_subject = Subject.objects.create(
            academy=other_academy, name="Math", description="Foreign"
        )
        other_cls = Class.objects.create(
            academy=other_academy,
            subject=other_subject,
            name="Foreign Class",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=5,
            session_price="50.00",
            session_duration=timedelta(hours=1),
        )
        foreign_schedule = ClassSchedule.objects.create(
            class_obj=other_cls,
            day_of_week=1,
            start_time=time(11, 0),
        )
        response = self.client.get(reverse("class-schedule-list"))
        ids = [s["id"] for s in response.data]
        self.assertNotIn(str(foreign_schedule.id), ids)

    # --- retrieve ---

    def test_retrieve_returns_200(self):
        response = self.client.get(
            reverse("class-schedule-detail", args=[self.schedule.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_end_time_computed(self):
        response = self.client.get(
            reverse("class-schedule-detail", args=[self.schedule.id])
        )
        # 09:00 + 1h30m = 10:30
        self.assertEqual(response.data["end_time"], "10:30:00")

    # --- create ---

    def test_create_returns_201(self):
        response = self.client.post(
            reverse("class-schedule-list"),
            {
                "class_obj": str(self.cls.id),
                "day_of_week": 3,
                "start_time": "14:00:00",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_sets_class_obj_from_perform_create(self):
        response = self.client.post(
            reverse("class-schedule-list"),
            {
                "class_obj": str(self.cls.id),
                "day_of_week": 4,
                "start_time": "15:00:00",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        schedule = ClassSchedule.objects.get(id=response.data["id"])
        self.assertEqual(schedule.class_obj, self.cls)

    # --- destroy ---

    def test_destroy_returns_204(self):
        schedule = ClassSchedule.objects.create(
            class_obj=self.cls,
            day_of_week=6,
            start_time=time(8, 0),
        )
        response = self.client.delete(
            reverse("class-schedule-detail", args=[schedule.id])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ClassSchedule.objects.filter(id=schedule.id).exists())

    # --- unauthenticated ---

    def test_unauthenticated_returns_401(self):
        self.client.logout()
        response = self.client.get(reverse("class-schedule-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ClassSessionEnrollmentViewSetTest(BaseViewTest):

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
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

    # --- list ---

    def test_list_returns_200(self):
        response = self.client.get(reverse("class-session-enrollment-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_contains_own_link(self):
        response = self.client.get(reverse("class-session-enrollment-list"))
        ids = [e["id"] for e in response.data]
        self.assertIn(str(self.link.id), ids)

    def test_list_filter_by_class_id(self):
        other_cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Class B",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=5,
            session_price="50.00",
            session_duration=timedelta(hours=1),
        )
        other_session = ClassSession.objects.create(
            session_date=date(2025, 3, 1),
            session_time=time(10, 0),
        )
        other_link = ClassSessionEnrollment.objects.create(
            class_obj=other_cls,
            session=other_session,
            session_num=1,
        )
        response = self.client.get(
            reverse("class-session-enrollment-list"), {"class_id": str(self.cls.id)}
        )
        ids = [e["id"] for e in response.data]
        self.assertIn(str(self.link.id), ids)
        self.assertNotIn(str(other_link.id), ids)

    def test_list_excludes_other_academy_links(self):
        other_academy = Academy.objects.create(
            name="Other Academy", email="other@test.com", phone="0000000000"
        )
        other_subject = Subject.objects.create(
            academy=other_academy, name="Math", description="Foreign"
        )
        other_cls = Class.objects.create(
            academy=other_academy,
            subject=other_subject,
            name="Foreign Class",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 30),
            session_count=5,
            session_price="50.00",
            session_duration=timedelta(hours=1),
        )
        other_session = ClassSession.objects.create(
            session_date=date(2025, 4, 1),
            session_time=time(11, 0),
        )
        foreign_link = ClassSessionEnrollment.objects.create(
            class_obj=other_cls,
            session=other_session,
            session_num=1,
        )
        response = self.client.get(reverse("class-session-enrollment-list"))
        ids = [e["id"] for e in response.data]
        self.assertNotIn(str(foreign_link.id), ids)

    # --- retrieve ---

    def test_retrieve_returns_200(self):
        response = self.client.get(
            reverse("class-session-enrollment-detail", args=[self.link.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_session_date(self):
        response = self.client.get(
            reverse("class-session-enrollment-detail", args=[self.link.id])
        )
        self.assertEqual(response.data["session_date"], "2025-02-01")

    # --- write methods not allowed (ReadOnlyModelViewSet) ---

    def test_post_returns_405(self):
        response = self.client.post(reverse("class-session-enrollment-list"), {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_returns_405(self):
        response = self.client.delete(
            reverse("class-session-enrollment-detail", args=[self.link.id])
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    # --- unauthenticated ---

    def test_unauthenticated_returns_401(self):
        self.client.logout()
        response = self.client.get(reverse("class-session-enrollment-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)