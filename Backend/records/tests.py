 # records/tests.py

from datetime import date, time, timedelta

from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Academy, User, Students
from structure.models import Subject, Class, ClassSessionEnrollment
from financial_operations.models import Enrollment, Payment
from records.models import ClassSession, Attendance
from records.serializers import ClassSessionSerializer, AttendanceSerializer
from records.helpers.attendance_signals import get_attendance_pct_28d


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


class RecordsTestSetupMixin:

    def base_setup(self):
        uid = id(self)
        self.academy = create_academy(email=f"academy-{uid}@test.com")
        self.student_user, self.student_profile = create_student_with_profile(
            self.academy, email=f"student-{uid}@test.com"
        )
        self.subject = Subject.objects.create(
            academy=self.academy, name="Physics", description="Physics"
        )
        self.class_obj = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Physics A",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            session_count=20,
            session_price=100,
        )
        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj, student_id=self.student_profile
        )
        self.session = ClassSession.objects.create(
            session_date=date.today(), session_time=time(12, 0)
        )
        self.link = ClassSessionEnrollment.objects.create(
            class_obj=self.class_obj, session=self.session, session_num=1
        )


# ===========================================================================
# MODEL TESTS
# ===========================================================================

class ClassSessionModelTests(TestCase):

    def setUp(self):
        self.session = ClassSession.objects.create(
            session_date=date.today(), session_time=time(10, 0)
        )

    def test_session_created(self):
        self.assertIsNotNone(self.session.id)

    def test_session_str(self):
        self.assertIn(str(self.session.session_date), str(self.session))

    def test_unique_session_datetime(self):
        with self.assertRaises(IntegrityError):
            ClassSession.objects.create(
                session_date=self.session.session_date,
                session_time=self.session.session_time,
            )

    def test_default_notes_empty(self):
        self.assertEqual(self.session.notes, "")

    def test_ordering_by_date_time(self):
        ClassSession.objects.create(
            session_date=date.today() + timedelta(days=1), session_time=time(9, 0)
        )
        sessions = list(ClassSession.objects.all())
        dates = [(s.session_date, s.session_time) for s in sessions]
        self.assertEqual(dates, sorted(dates))


class AttendanceModelTests(RecordsTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_attendance_creation(self):
        attendance = Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        self.assertTrue(attendance.present)
        self.assertIsNotNone(attendance.recorded_at)

    def test_attendance_default_present_false(self):
        attendance = Attendance.objects.create(
            session=self.session, enrollment=self.enrollment
        )
        self.assertFalse(attendance.present)

    def test_attendance_str(self):
        attendance = Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        self.assertIn("Present", str(attendance))

    def test_attendance_str_absent(self):
        attendance = Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=False
        )
        self.assertIn("Absent", str(attendance))

    def test_unique_attendance_constraint(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        with self.assertRaises(IntegrityError):
            Attendance.objects.create(
                session=self.session, enrollment=self.enrollment, present=False
            )

    def test_attendance_deleted_on_session_delete(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        self.session.delete()
        self.assertEqual(Attendance.objects.count(), 0)

    def test_attendance_deleted_on_enrollment_delete(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        # Enrollment has PROTECT on its FK, but Attendance cascades on enrollment
        # We can't delete via enrollment.delete() if Payment exists; delete payment first
        Payment.objects.filter(enrollment_id=self.enrollment).delete()
        self.enrollment.delete()
        self.assertEqual(Attendance.objects.count(), 0)


# ===========================================================================
# SERIALIZER TESTS
# ===========================================================================

class AttendanceSerializerTests(RecordsTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_exposes_student_name(self):
        attendance = Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        data = AttendanceSerializer(attendance).data
        self.assertEqual(data["student_name"], self.student_user.full_name)

    def test_exposes_student_id(self):
        attendance = Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        data = AttendanceSerializer(attendance).data
        # student_id source is enrollment.student_id.user_id  (the user PK)
        self.assertIn("student_id", data)
        self.assertIsNotNone(data["student_id"])

    def test_recorded_at_read_only(self):
        serializer = AttendanceSerializer(data={
            "session": self.session.id,
            "enrollment": self.enrollment.id,
            "present": True,
            "recorded_at": "2020-01-01T00:00:00Z",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn("recorded_at", serializer.validated_data)

    def test_present_field_serialized(self):
        attendance = Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        data = AttendanceSerializer(attendance).data
        self.assertTrue(data["present"])


class ClassSessionSerializerTests(RecordsTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    class _FakeRequest:
        def __init__(self, user, data=None):
            self.user = user
            self.data = data or {}

    def test_create_with_empty_class_ids_raises(self):
        serializer = ClassSessionSerializer(
            data={
                "session_date": str(date.today() + timedelta(days=5)),
                "session_time": "09:00:00",
                "notes": "",
            },
            context={
                "request": self._FakeRequest(self.student_user, {"class_ids": []})
            },
        )
        serializer.is_valid(raise_exception=True)
        with self.assertRaises(Exception):
            serializer.save()

    def test_serializer_fields_present(self):
        data = ClassSessionSerializer(self.session).data
        for field in ("id", "session_date", "session_time", "notes"):
            self.assertIn(field, data)


# ===========================================================================
# HELPERS TESTS
# ===========================================================================

class AttendanceSignalHelperTests(RecordsTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()

    def test_returns_none_when_no_recent_sessions(self):
        pct = get_attendance_pct_28d(self.enrollment.id)
        self.assertIsNone(pct)

    def test_returns_percentage_with_recent_attendance(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        pct = get_attendance_pct_28d(self.enrollment.id)
        self.assertEqual(pct, 100.0)

    def test_ignores_sessions_outside_window(self):
        old_session = ClassSession.objects.create(
            session_date=date.today() - timedelta(days=40),
            session_time=time(9, 0),
        )
        Attendance.objects.create(
            session=old_session, enrollment=self.enrollment, present=True
        )
        pct = get_attendance_pct_28d(self.enrollment.id)
        self.assertIsNone(pct)

    def test_mixed_attendance_percentage(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        absent_session = ClassSession.objects.create(
            session_date=date.today(), session_time=time(15, 0)
        )
        Attendance.objects.create(
            session=absent_session, enrollment=self.enrollment, present=False
        )
        pct = get_attendance_pct_28d(self.enrollment.id)
        self.assertEqual(pct, 50.0)

    def test_returns_zero_when_all_absent(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=False
        )
        pct = get_attendance_pct_28d(self.enrollment.id)
        self.assertEqual(pct, 0.0)


# ===========================================================================
# API / VIEW TESTS
# ===========================================================================

class ClassSessionApiTests(RecordsTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_session_list(self):
        response = self.client.get("/api/sessions/")
        self.assertEqual(response.status_code, 200)

    def test_session_list_requires_owner(self):
        non_owner = create_user(
            self.academy, User.Roles.TEACHER, f"teacher-{id(self)}@test.com"
        )
        client = APIClient()
        client.force_authenticate(non_owner)
        response = client.get("/api/sessions/")
        self.assertEqual(response.status_code, 403)

    def test_session_retrieve(self):
        response = self.client.get(f"/api/sessions/{self.session.id}/")
        self.assertEqual(response.status_code, 200)

    def test_create_session(self):
        response = self.client.post(
            "/api/sessions/",
            {
                "class_ids": [str(self.class_obj.id)],
                "session_date": str(date.today() + timedelta(days=1)),
                "session_time": "15:00:00",
                "notes": "Session",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassSession.objects.count(), 2)

    def test_create_session_requires_class_ids(self):
        response = self.client.post(
            "/api/sessions/",
            {
                "session_date": str(date.today() + timedelta(days=2)),
                "session_time": "16:00:00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_filter_sessions_by_class(self):
        response = self.client.get(
            f"/api/sessions/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_destroy_session_cascades(self):
        response = self.client.delete(f"/api/sessions/{self.session.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            ClassSessionEnrollment.objects.filter(session_id=self.session.id).exists()
        )

    def test_session_put_not_allowed(self):
        response = self.client.put(
            f"/api/sessions/{self.session.id}/", {}, format="json"
        )
        self.assertEqual(response.status_code, 405)

    # ------------------------------------------------------------------
    # Attendance nested action
    # ------------------------------------------------------------------

    def test_attendance_list_empty(self):
        response = self.client.get(f"/api/sessions/{self.session.id}/attendance/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_attendance_get_existing(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        response = self.client.get(f"/api/sessions/{self.session.id}/attendance/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_bulk_attendance_create(self):
        response = self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {"records": [{"enrollment_id": str(self.enrollment.id), "present": True}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["updated"], 0)

    def test_bulk_attendance_invalid_empty_records(self):
        response = self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {"records": []},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_attendance_update_existing(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=False
        )
        response = self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {"records": [{"enrollment_id": str(self.enrollment.id), "present": True}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["updated"], 1)
        self.assertEqual(response.data["created"], 0)

    def test_attendance_creates_pending_payment(self):
        Payment.objects.all().delete()
        response = self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {"records": [{"enrollment_id": str(self.enrollment.id), "present": True}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            Payment.objects.filter(
                enrollment_id=self.enrollment, status="pending"
            ).exists()
        )

    def test_attendance_no_duplicate_pending_payment(self):
        Payment.objects.create(
            enrollment_id=self.enrollment, amount=100, status="pending"
        )
        self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {"records": [{"enrollment_id": str(self.enrollment.id), "present": True}]},
            format="json",
        )
        self.assertEqual(
            Payment.objects.filter(
                enrollment_id=self.enrollment, status="pending"
            ).count(),
            1,
        )

    def test_attendance_absent_does_not_create_payment(self):
        Payment.objects.all().delete()
        self.client.post(
            f"/api/sessions/{self.session.id}/attendance/",
            {"records": [{"enrollment_id": str(self.enrollment.id), "present": False}]},
            format="json",
        )
        self.assertFalse(Payment.objects.exists())


class StudentAttendanceApiTests(RecordsTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_student_stats_present(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        response = self.client.get(
            f"/api/students/{self.student_profile.pk}/attendance/stats/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["present_count"], 1)
        self.assertEqual(response.data["attendance_pct"], 100.0)

    def test_student_stats_requires_class(self):
        response = self.client.get(
            f"/api/students/{self.student_profile.pk}/attendance/stats/"
        )
        self.assertEqual(response.status_code, 400)

    def test_student_stats_absent(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=False
        )
        response = self.client.get(
            f"/api/students/{self.student_profile.pk}/attendance/stats/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["absent_count"], 1)
        self.assertEqual(response.data["attendance_pct"], 0)

    def test_student_stats_no_records(self):
        response = self.client.get(
            f"/api/students/{self.student_profile.pk}/attendance/stats/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_sessions"], 0)
        self.assertEqual(response.data["attendance_pct"], 0)

    def test_student_history_requires_class(self):
        response = self.client.get(
            f"/api/students/{self.student_profile.pk}/attendance/history/"
        )
        self.assertEqual(response.status_code, 400)

    def test_student_history(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        response = self.client.get(
            f"/api/students/{self.student_profile.pk}/attendance/history/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_student_history_contains_session_num(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        response = self.client.get(
            f"/api/students/{self.student_profile.pk}/attendance/history/?class_id={self.class_obj.id}"
        )
        self.assertEqual(response.data[0]["session_num"], 1)


class ClassAttendanceApiTests(RecordsTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_class_summary(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        response = self.client.get(
            f"/api/classes/{self.class_obj.id}/attendance/summary/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_class_summary_turnout_percentage(self):
        Attendance.objects.create(
            session=self.session, enrollment=self.enrollment, present=True
        )
        response = self.client.get(
            f"/api/classes/{self.class_obj.id}/attendance/summary/"
        )
        self.assertEqual(response.data[0]["turnout_pct"], 100.0)

    def test_class_summary_empty(self):
        response = self.client.get(
            f"/api/classes/{self.class_obj.id}/attendance/summary/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["turnout_pct"], 0)


class GenerateSessionsApiTests(RecordsTestSetupMixin, TestCase):

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)
        from structure.models import ClassSchedule
        self.class_obj.session_duration = timedelta(hours=1)
        self.class_obj.save()
        self.schedule = ClassSchedule.objects.create(
            class_obj=self.class_obj,
            day_of_week=date.today().weekday(),
            start_time=time(9, 0),
        )

    def test_requires_dates(self):
        response = self.client.post(
            f"/api/classes/{self.class_obj.id}/generate-sessions/", {}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_date_format(self):
        response = self.client.post(
            f"/api/classes/{self.class_obj.id}/generate-sessions/",
            {"start_date": "not-a-date", "end_date": "also-not"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_end_before_start_rejected(self):
        response = self.client.post(
            f"/api/classes/{self.class_obj.id}/generate-sessions/",
            {
                "start_date": str(date.today()),
                "end_date": str(date.today() - timedelta(days=1)),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_no_schedule_rejected(self):
        from structure.models import ClassSchedule
        ClassSchedule.objects.all().delete()
        response = self.client.post(
            f"/api/classes/{self.class_obj.id}/generate-sessions/",
            {
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=7)),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_generates_sessions_on_matching_weekday(self):
        start = date.today()
        end = start + timedelta(days=7)
        response = self.client.post(
            f"/api/classes/{self.class_obj.id}/generate-sessions/",
            {"start_date": str(start), "end_date": str(end)},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data["sessions_created"], 1)

    def test_class_not_found(self):
        import uuid
        response = self.client.post(
            f"/api/classes/{uuid.uuid4()}/generate-sessions/",
            {
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=7)),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 404)


# ===========================================================================
# INTEGRATION TESTS
# ===========================================================================

class AttendanceFullFlowIntegrationTests(RecordsTestSetupMixin, TestCase):
    """Create session → submit attendance → verify stats + payment signal."""

    def setUp(self):
        self.base_setup()
        self.client = APIClient()
        self.owner = create_user(
            self.academy, User.Roles.OWNER, f"integ-owner-{id(self)}@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_full_attendance_flow(self):
        # 1. Create a new session for the class
        create_resp = self.client.post(
            "/api/sessions/",
            {
                "class_ids": [str(self.class_obj.id)],
                "session_date": str(date.today() + timedelta(days=2)),
                "session_time": "14:00:00",
                "notes": "Integration session",
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        new_session_id = create_resp.data["id"]

        # 2. Mark student present
        Payment.objects.all().delete()
        attend_resp = self.client.post(
            f"/api/sessions/{new_session_id}/attendance/",
            {"records": [{"enrollment_id": str(self.enrollment.id), "present": True}]},
            format="json",
        )
        self.assertEqual(attend_resp.status_code, 200)
        self.assertEqual(attend_resp.data["created"], 1)

        # 3. Payment should be created
        self.assertTrue(
            Payment.objects.filter(enrollment_id=self.enrollment, status="pending").exists()
        )

        # 4. Stats should reflect the new attendance
        stats_resp = self.client.get(
            f"/api/students/{self.student_profile.pk}/attendance/stats/?class_id={self.class_obj.id}"
        )
        self.assertEqual(stats_resp.status_code, 200)
        self.assertEqual(stats_resp.data["present_count"], 1)
