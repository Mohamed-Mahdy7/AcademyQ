from unittest.mock import patch
from datetime import date, time
from django.test import TestCase

from core.models import Academy, User, Students
from structure.models import Subject, Class
from financial_operations.models import Enrollment, Payment
from records.models import ClassSession, Attendance
from ai.reports.generator import generate_report_card
from ai.reports.models import AIReportCard


class GenerateReportCardTest(TestCase):

    def setUp(self):
        self.academy = Academy.objects.create(
            name="Test Academy", email="test@academy.com", phone="01000000000"
        )
        self.student_user = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            full_name="Ahmed Mohamed",
            role="S",
            phone="01000000001",
            academy=self.academy,
        )
        self.student = Students.objects.create(
            user=self.student_user,
            academy=self.academy,
            parent_email="parent@test.com",
            educational_level=7,
            status="A",
        )
        self.subject = Subject.objects.create(
            academy=self.academy, name="Mathematics", description="Core math"
        )
        self.class_obj = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Math G7",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 6, 1),
            session_count=10,
            session_price=50,
        )
        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student,
            start_date=date(2026, 1, 1),
        )

    def _create_session_with_attendance(self, session_date, present, notes=""):
        session = ClassSession.objects.create(
            session_date=session_date,
            session_time=time(16, 0),
            notes=notes,
        )
        Attendance.objects.create(
            session=session,
            enrollment=self.enrollment,
            present=present,
        )
        return session

    @patch("ai.reports.generator.generate_text")
    def test_generates_report_with_full_attendance_and_completed_payment(self, mock_generate):
        mock_generate.return_value = "Great progress this month."

        for day in [5, 10, 15]:
            self._create_session_with_attendance(
                date(2026, 1, day), present=True, notes=f"Note {day}"
            )

        Payment.objects.create(
            enrollment_id=self.enrollment,
            amount=500,
            due_date=date(2026, 1, 4),
            paid_on=date(2026, 1, 1),
            status="completed",
        )

        report = generate_report_card(self.enrollment, "2026-01")

        self.assertEqual(report.summary_text, "Great progress this month.")
        self.assertEqual(report.risk_level, "low")
        self.assertEqual(report.risk_score, 0)
        self.assertEqual(report.student, self.student)
        self.assertEqual(report.month, "2026-01")

    @patch("ai.reports.generator.generate_text")
    def test_low_attendance_and_pending_payment_results_in_high_risk(self, mock_generate):
        mock_generate.return_value = "Needs attention."

        # 1 present out of 3 -> ~33% attendance
        self._create_session_with_attendance(date(2026, 1, 5), present=True)
        self._create_session_with_attendance(date(2026, 1, 10), present=False)
        self._create_session_with_attendance(date(2026, 1, 15), present=False)

        Payment.objects.create(
            enrollment_id=self.enrollment,
            amount=500,
            due_date=date(2026, 1, 4),
            paid_on=None,
            status="pending",
        )

        report = generate_report_card(self.enrollment, "2026-01")

        self.assertEqual(report.risk_level, "high")
        self.assertGreaterEqual(report.risk_score, 60)

    @patch("ai.reports.generator.generate_text")
    def test_overdue_payment_treated_as_unpaid(self, mock_generate):
        mock_generate.return_value = "Reminder needed."

        for day in [5, 10, 15]:
            self._create_session_with_attendance(date(2026, 1, day), present=True)

        # due_date in the past, still pending -> overdue
        Payment.objects.create(
            enrollment_id=self.enrollment,
            amount=500,
            due_date=date(2020, 1, 4),
            paid_on=None,
            status="pending",
        )

        report = generate_report_card(self.enrollment, "2026-01")

        # full attendance but overdue payment -> medium risk
        self.assertEqual(report.risk_level, "medium")

    @patch("ai.reports.generator.generate_text")
    def test_no_sessions_in_month_gives_zero_attendance(self, mock_generate):
        mock_generate.return_value = "No data this month."

        report = generate_report_card(self.enrollment, "2026-02")

        self.assertEqual(report.risk_level, "high")

    @patch("ai.reports.generator.generate_text")
    def test_teacher_notes_aggregated(self, mock_generate):
        mock_generate.return_value = "Summary"

        self._create_session_with_attendance(
            date(2026, 1, 5), present=True, notes="Covered chapter 3"
        )
        self._create_session_with_attendance(
            date(2026, 1, 10), present=True, notes="Quiz results good"
        )

        generate_report_card(self.enrollment, "2026-01")

        called_prompt = mock_generate.call_args[0][0]
        self.assertIn("Covered chapter 3", called_prompt)
        self.assertIn("Quiz results good", called_prompt)

    @patch("ai.reports.generator.generate_text")
    def test_regenerating_same_month_updates_existing_report(self, mock_generate):
        mock_generate.return_value = "First version"
        self._create_session_with_attendance(date(2026, 1, 5), present=True)
        report1 = generate_report_card(self.enrollment, "2026-01")

        mock_generate.return_value = "Updated version"
        report2 = generate_report_card(self.enrollment, "2026-01")

        self.assertEqual(report1.id, report2.id)
        self.assertEqual(report2.summary_text, "Updated version")
        self.assertEqual(
            AIReportCard.objects.filter(
                enrollment=self.enrollment, month="2026-01"
            ).count(),
            1,
        )

    @patch("ai.reports.generator.generate_text")
    def test_no_payment_record_returns_unknown_status_and_high_risk(self, mock_generate):
        mock_generate.return_value = "No payment info."

        for day in [5, 10, 15]:
            self._create_session_with_attendance(date(2026, 1, day), present=True)

        report = generate_report_card(self.enrollment, "2026-01")

        called_prompt = mock_generate.call_args[0][0]
        self.assertIn("No active enrollments", called_prompt)
        self.assertEqual(report.risk_level, "medium")