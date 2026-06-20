from datetime import date, timedelta
from django.test import TestCase

from core.models import User, Academy, Students
from structure.models import Subject, Class
from financial_operations.models import Enrollment
from records.models import ClassSession, Attendance
from records.helpers.attendance_signals import get_attendance_pct_28d


class GetAttendancePct28dTests(TestCase):
    def setUp(self):
        from core.models import Academy
        self.academy = Academy.objects.create(
            name="Test Academy", email="academy2@test.com"
        )
        self.subject = Subject.objects.create(
            academy=self.academy, name="Math", description="Math"
        )
        self.cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Math G7",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            session_count=20,
            session_price=100,
        )
        self.student = User.objects.create_user(
            email="student2@test.com",
            password="test1234",
            full_name="Test Student 2",
            phone="01000000002",
            role="S",
            academy=self.academy,
        )
        self.student_obj = Students.objects.create(
            user=self.student,
            academy=self.academy,
            parent_email="parent@test.com",
            educational_level=7,
            status="A",
            enrolled_at=date(2026, 1, 1),
        )
        self.enrollment = Enrollment.objects.create(
            class_id=self.cls,
            student_id=self.student_obj,
            start_date=date(2026, 1, 1),
            status="active",
        )

    def _make_session(self, days_ago: int) -> ClassSession:
        return ClassSession.objects.create(
            session_date=date.today() - timedelta(days=days_ago),
            session_time="16:00:00",
            notes="",
        )

    def _make_attendance(self, session, present: bool):
        return Attendance.objects.create(
            session=session,
            enrollment=self.enrollment,
            present=present,
        )

    def test_no_sessions_returns_none(self):
        result = get_attendance_pct_28d(self.enrollment.id)
        self.assertIsNone(result)

    def test_all_present_returns_100(self):
        for days_ago in [5, 10, 15]:
            session = self._make_session(days_ago)
            self._make_attendance(session, present=True)
        result = get_attendance_pct_28d(self.enrollment.id)
        self.assertEqual(result, 100.0)

    def test_all_absent_returns_0(self):
        for days_ago in [5, 10, 15]:
            session = self._make_session(days_ago)
            self._make_attendance(session, present=False)
        result = get_attendance_pct_28d(self.enrollment.id)
        self.assertEqual(result, 0.0)

    def test_mixed_attendance(self):
        # 2 present, 2 absent = 50%
        for days_ago in [5, 10]:
            self._make_attendance(self._make_session(days_ago), present=True)
        for days_ago in [15, 20]:
            self._make_attendance(self._make_session(days_ago), present=False)
        result = get_attendance_pct_28d(self.enrollment.id)
        self.assertEqual(result, 50.0)

    def test_session_outside_28d_window_excluded(self):
        # 1 present inside window, 1 absent outside window
        self._make_attendance(self._make_session(10), present=True)
        self._make_attendance(self._make_session(30), present=False)
        result = get_attendance_pct_28d(self.enrollment.id)
        # only the in-window session counts → 100%
        self.assertEqual(result, 100.0)

    def test_session_exactly_at_28d_boundary_included(self):
        self._make_attendance(self._make_session(28), present=False)
        result = get_attendance_pct_28d(self.enrollment.id)
        self.assertEqual(result, 0.0)

    def test_different_enrollment_not_included(self):
        other_student = User.objects.create_user(
            email="other2@test.com",
            password="test1234",
            full_name="Other Student 2",
            phone="01000000003",
            role="S",
            academy=self.academy,
        )
        other_student_obj = Students.objects.create(
            user=other_student,
            academy=self.academy,
            parent_email="other_parent@test.com",
            educational_level=7,
            status="A",
            enrolled_at=date(2026, 1, 1),
        )
        other_enrollment = Enrollment.objects.create(
            class_id=self.cls,
            student_id=other_student_obj,
            start_date=date(2026, 1, 1),
            status="active",
        )
        session = self._make_session(5)
        Attendance.objects.create(
            session=session,
            enrollment=other_enrollment,
            present=False,
        )
        # original enrollment has no attendance records
        result = get_attendance_pct_28d(self.enrollment.id)
        self.assertIsNone(result)

    def test_none_returned_not_zero_when_no_data(self):
        # Explicitly confirm None != 0.0 — missing data is not 0% attendance
        result = get_attendance_pct_28d(self.enrollment.id)
        self.assertIsNone(result)
        self.assertNotEqual(result, 0.0)