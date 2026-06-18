from unittest.mock import patch
from datetime import date, time
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from core.models import Academy, User
from structure.models import Subject, Class
from financial_operations.models import Enrollment, Payment
from records.models import ClassSession, Attendance
from ai.reports.models import AIReportCard


class AIReportCardViewSetTest(APITestCase):

    def setUp(self):
        self.client = APIClient()

        self.academy = Academy.objects.create(
            name="Test Academy", email="test@academy.com", phone="01000000000"
        )
        self.other_academy = Academy.objects.create(
            name="Other Academy", email="other@academy.com", phone="01111111111"
        )

        self.owner = User.objects.create_user(
            email="owner@test.com",
            password="testpass123",
            full_name="Academy Owner",
            role="O",
            educational_level=1,
            phone="01000000002",
            academy=self.academy,
        )
        self.teacher_user = User.objects.create_user(
            email="teacher@test.com",
            password="testpass123",
            full_name="Teacher",
            role="T",
            educational_level=1,
            phone="01000000003",
            academy=self.academy,
        )
        self.student = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            full_name="Ahmed Mohamed",
            role="S",
            educational_level=7,
            phone="01000000001",
            academy=self.academy,
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

        # an existing report
        self.report = AIReportCard.objects.create(
            student=self.student,
            enrollment=self.enrollment,
            month="2026-01",
            summary_text="Existing summary",
            risk_level="low",
            risk_score=10,
        )

        self.client.force_authenticate(user=self.owner)

    # ── List / Retrieve ─────────────────────────────────────

    def test_list_reports(self):
        response = self.client.get("/api/reports/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/reports/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_report(self):
        response = self.client.get(f"/api/reports/{self.report.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary_text"], "Existing summary")
        self.assertEqual(response.data["student_name"], "Ahmed Mohamed")
        self.assertEqual(response.data["class_name"], "Math G7")

    def test_filter_by_student_id(self):
        response = self.client.get(f"/api/reports/?student_id={self.student.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_filter_by_month_no_match(self):
        response = self.client.get("/api/reports/?month=2026-02")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_does_not_return_other_academy_reports(self):
        other_student = User.objects.create_user(
            email="other_student@test.com",
            password="testpass123",
            full_name="Other Student",
            role="S",
            educational_level=7,
            phone="01000000010",
            academy=self.other_academy,
        )
        other_subject = Subject.objects.create(
            academy=self.other_academy, name="Science", description="desc"
        )
        other_class = Class.objects.create(
            academy=self.other_academy,
            subject=other_subject,
            name="Science G7",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 6, 1),
            session_count=10,
            session_price=50,
        )
        other_enrollment = Enrollment.objects.create(
            class_id=other_class,
            student_id=other_student,
            start_date=date(2026, 1, 1),
        )
        AIReportCard.objects.create(
            student=other_student,
            enrollment=other_enrollment,
            month="2026-01",
            summary_text="Other academy report",
            risk_level="low",
            risk_score=10,
        )

        response = self.client.get("/api/reports/")
        self.assertEqual(len(response.data), 1)  # only own academy's report

    # ── Generate Action ──────────────────────────────────────

    @patch("ai.reports.generator.generate_text")
    def test_generate_report_as_owner(self, mock_generate):
        mock_generate.return_value = "New summary"

        response = self.client.post(
            "/api/reports/generate/",
            {"enrollment_id": str(self.enrollment.id), "month": "2026-02"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["summary_text"], "New summary")
        self.assertEqual(response.data["month"], "2026-02")

    @patch("ai.reports.generator.generate_text")
    def test_generate_report_updates_existing_month(self, mock_generate):
        mock_generate.return_value = "Updated summary"

        response = self.client.post(
            "/api/reports/generate/",
            {"enrollment_id": str(self.enrollment.id), "month": "2026-01"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["id"], str(self.report.id))
        self.assertEqual(response.data["summary_text"], "Updated summary")
        self.assertEqual(AIReportCard.objects.count(), 1)

    def test_generate_report_as_teacher_forbidden(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(
            "/api/reports/generate/",
            {"enrollment_id": str(self.enrollment.id), "month": "2026-02"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_generate_report_invalid_month_format(self):
        response = self.client.post(
            "/api/reports/generate/",
            {"enrollment_id": str(self.enrollment.id), "month": "2026-13"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_generate_report_enrollment_not_found(self):
        import uuid
        response = self.client.post(
            "/api/reports/generate/",
            {"enrollment_id": str(uuid.uuid4()), "month": "2026-02"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_generate_report_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/reports/generate/",
            {"enrollment_id": str(self.enrollment.id), "month": "2026-02"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_report_as_owner(self):
        response = self.client.delete(f"/api/reports/{self.report.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AIReportCard.objects.filter(id=self.report.id).exists())

    def test_delete_report_as_teacher_forbidden(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(f"/api/reports/{self.report.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(AIReportCard.objects.filter(id=self.report.id).exists())