"""
AQ-074 — Full AI Agent QA.

Covers: permissions, missing/zero data edge cases, scan resilience,
rate limiting, and LLM failure handling.
"""

from datetime import date, timedelta
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from core.models import Academy, User, Students
from structure.models import Subject, Class
from financial_operations.models import Enrollment, Payment
from grades.models import Grade
from records.models import ClassSession, Attendance
from ai.agent.models import Alert, ScanLog
from ai.agent.helpers.risk_scorer import risk_scorer
from ai.agent.helpers.context_builder import build_risk_context
from ai.agent.tasks import run_risk_scan


class BaseAgentQATestCase(TestCase):
    def setUp(self):
        self.academy = Academy.objects.create(
            name="QA Academy", email="qa@test.com",
            subscription_end=date.today() + timedelta(days=365),
        )
        self.subject = Subject.objects.create(
            academy=self.academy, name="Math", description="Math"
        )
        self.cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Math QA",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            session_count=20,
            session_price=100,
        )

        self.owner = User.objects.create_user(
            email="qa_owner@test.com",
            password="test1234",
            full_name="QA Owner",
            phone="01000000010",
            role="O",
            academy=self.academy,
        )

        student_user = User.objects.create_user(
            email="qa_student@test.com",
            password="test1234",
            full_name="QA Student",
            phone="01000000011",
            role="S",
            academy=self.academy,
        )
        self.student = Students.objects.create(
            user=student_user,
            academy=self.academy,
            parent_email="qa_parent@test.com",
            educational_level=7,
            status="A",
            enrolled_at=date(2026, 1, 1),
        )

        self.enrollment = Enrollment.objects.create(
            class_id=self.cls,
            student_id=self.student,
            start_date=date(2026, 1, 1),
            status="active",
        )

        self.client = APIClient()


# ---------------------------------------------------------------------------
# 1. PERMISSIONS — non-owner gets 403
# ---------------------------------------------------------------------------

class PermissionTests(BaseAgentQATestCase):
    def setUp(self):
        super().setUp()
        self.alert = Alert.objects.create(
            enrollment=self.enrollment,
            risk_level="low",
            risk_score=10,
            primary_reason="test",
            recommended_action="test",
        )
        # non-owner: a student-role user
        self.client.force_authenticate(user=self.student.user)

    def test_alert_list_forbidden_for_non_owner(self):
        res = self.client.get('/api/alerts/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_alert_detail_forbidden_for_non_owner(self):
        res = self.client.get(f'/api/alerts/{self.alert.id}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_alert_patch_forbidden_for_non_owner(self):
        res = self.client.patch(
            f'/api/alerts/{self.alert.id}/',
            {'is_dismissed': True},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_alert_stats_forbidden_for_non_owner(self):
        res = self.client.get('/api/alerts/stats/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_run_scan_forbidden_for_non_owner(self):
        res = self.client.post('/api/agent/run-scan/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_scan_history_forbidden_for_non_owner(self):
        res = self.client.get('/api/agent/scans/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_generate_message_forbidden_for_non_owner(self):
        res = self.client.post(f'/api/alerts/{self.alert.id}/generate-message/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# 2. ZERO / MISSING DATA EDGE CASES
# ---------------------------------------------------------------------------

class ZeroDataEdgeCaseTests(BaseAgentQATestCase):
    """
    Enrollment exists but has no attendance, no grades, no payments at all.
    risk_scorer should return all-safe/low with no crash.
    """

    def test_context_builder_returns_all_none_for_empty_enrollment(self):
        context = build_risk_context(self.enrollment.id)
        self.assertIsNone(context["attendance_pct_28d"])
        self.assertIsNone(context["avg_score_last_2"])
        # overdue_days depends on Mahdy's context — may be None either way

    def test_risk_scorer_handles_all_none_context(self):
        context = {
            "attendance_pct_28d": None,
            "overdue_days": None,
            "avg_score_last_2": None,
        }
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], 0)
        self.assertEqual(result["risk_level"], "low")

    def test_scan_does_not_crash_on_enrollment_with_no_data(self):
        scan_log = ScanLog.objects.create(
            academy=self.academy, triggered_by="manual", status="running"
        )
        result = run_risk_scan(self.academy.id, scan_log)
        self.assertEqual(result["errors"], 0)
        self.assertEqual(result["students_scanned"], 1)
        scan_log.refresh_from_db()
        self.assertEqual(scan_log.status, "complete")

    def test_single_grade_does_not_trigger_low_score_rule(self):
        # only 1 grade exists — get_avg_score_last_2 requires 2+
        Grade.objects.create(
            enrollment=self.enrollment,
            session=None,
            subject_name="Math",
            score=10,
            max_score=100,  # 10% — would trigger if counted
            assigned_at=date.today(),
        )
        context = build_risk_context(self.enrollment.id)
        self.assertIsNone(context["avg_score_last_2"])

    def test_zero_max_score_grade_does_not_crash(self):
        Grade.objects.create(
            enrollment=self.enrollment,
            session=None,
            subject_name="Math",
            score=0,
            max_score=0,
            assigned_at=date.today(),
        )
        Grade.objects.create(
            enrollment=self.enrollment,
            session=None,
            subject_name="Math",
            score=5,
            max_score=10,
            assigned_at=date.today() - timedelta(days=1),
        )
        # should not raise ZeroDivisionError
        context = build_risk_context(self.enrollment.id)
        self.assertIsNotNone(context["avg_score_last_2"])


# ---------------------------------------------------------------------------
# 3. SCAN RESILIENCE — one bad enrollment shouldn't abort the batch
# ---------------------------------------------------------------------------

class ScanResilienceTests(BaseAgentQATestCase):
    def setUp(self):
        super().setUp()
        # second, healthy enrollment to prove the batch continues
        student_user2 = User.objects.create_user(
            email="qa_student2@test.com",
            password="test1234",
            full_name="QA Student 2",
            phone="01000000012",
            role="S",
            academy=self.academy,
        )
        self.student2 = Students.objects.create(
            user=student_user2,
            academy=self.academy,
            parent_email="qa_parent2@test.com",
            educational_level=7,
            status="A",
            enrolled_at=date(2026, 1, 1),
        )
        self.enrollment2 = Enrollment.objects.create(
            class_id=self.cls,
            student_id=self.student2,
            start_date=date(2026, 1, 1),
            status="active",
        )

    @patch("ai.agent.tasks.build_risk_context")
    def test_one_failure_does_not_abort_whole_scan(self, mock_build_context):
        def side_effect(enrollment_id):
            if enrollment_id == self.enrollment.id:
                raise RuntimeError("simulated failure")
            return {
                "attendance_pct_28d": 95,
                "overdue_days": None,
                "avg_score_last_2": 90,
            }

        mock_build_context.side_effect = side_effect

        scan_log = ScanLog.objects.create(
            academy=self.academy, triggered_by="manual", status="running"
        )
        result = run_risk_scan(self.academy.id, scan_log)

        self.assertEqual(result["errors"], 1)
        self.assertEqual(result["students_scanned"], 1)  # only the healthy one
        scan_log.refresh_from_db()
        self.assertIn(str(self.enrollment.id), scan_log.error_log)
        self.assertEqual(scan_log.status, "complete")


# ---------------------------------------------------------------------------
# 4. RATE LIMITING — 4th manual scan in a day returns 429
# ---------------------------------------------------------------------------

class RateLimitTests(BaseAgentQATestCase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.owner)

    def test_fourth_manual_scan_in_one_day_returns_429(self):
        for i in range(3):
            res = self.client.post('/api/agent/run-scan/')
            self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)

        res = self.client.post('/api/agent/run-scan/')
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_scheduled_scans_do_not_count_toward_manual_limit(self):
        ScanLog.objects.create(
            academy=self.academy, triggered_by="scheduled", status="complete"
        )
        ScanLog.objects.create(
            academy=self.academy, triggered_by="scheduled", status="complete"
        )
        ScanLog.objects.create(
            academy=self.academy, triggered_by="scheduled", status="complete"
        )
        # manual scan should still succeed — scheduled scans don't count
        res = self.client.post('/api/agent/run-scan/')
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)


# ---------------------------------------------------------------------------
# 5. LLM FAILURE HANDLING
# ---------------------------------------------------------------------------

class LLMFailureTests(BaseAgentQATestCase):
    def setUp(self):
        super().setUp()
        self.alert = Alert.objects.create(
            enrollment=self.enrollment,
            risk_level="medium",
            risk_score=45,
            primary_reason="test reason",
            recommended_action="test action",
        )
        self.client.force_authenticate(user=self.owner)

    @patch("ai.utils.gemini_client.generate_text")
    @patch("ai.utils.rag_engine.get_student_context")
    def test_llm_timeout_returns_502_not_500(self, mock_context, mock_generate):
        mock_context.return_value = {"student_name": "QA Student"}
        mock_generate.side_effect = TimeoutError("Gemini timeout")

        res = self.client.post(f'/api/alerts/{self.alert.id}/generate-message/')
        self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)

    @patch("ai.utils.rag_engine.get_student_context")
    def test_student_context_failure_returns_502(self, mock_context):
        mock_context.side_effect = Exception("context lookup failed")

        res = self.client.post(f'/api/alerts/{self.alert.id}/generate-message/')
        self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)

    @patch("ai.utils.gemini_client.generate_text")
    @patch("ai.utils.rag_engine.get_student_context")
    def test_successful_generation_saves_message(self, mock_context, mock_generate):
        mock_context.return_value = {"student_name": "QA Student"}
        mock_generate.return_value = "Generated risk summary."

        res = self.client.post(f'/api/alerts/{self.alert.id}/generate-message/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.alert.refresh_from_db()
        self.assertEqual(self.alert.message, "Generated risk summary.")