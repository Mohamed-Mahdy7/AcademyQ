from unittest.mock import patch
from datetime import date, time
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from core.models import Academy, User
from structure.models import Subject, Class
from financial_operations.models import Enrollment
from ai.reports.tasks import generate_report_card_task, generate_class_reports_task
from ai.reports.models import AIReportCard


class GenerateReportCardTaskTest(APITestCase):

    def setUp(self):
        self.academy = Academy.objects.create(
            name="Test Academy", email="test@academy.com", phone="01000000000"
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

    @patch("ai.reports.generator.generate_text")
    def test_task_generates_report(self, mock_generate):
        mock_generate.return_value = "Summary text"

        result = generate_report_card_task(str(self.enrollment.id), "2026-01")

        self.assertTrue(result["success"])
        self.assertTrue(
            AIReportCard.objects.filter(
                enrollment=self.enrollment, month="2026-01"
            ).exists()
        )

    def test_task_returns_error_for_missing_enrollment(self):
        import uuid
        result = generate_report_card_task(str(uuid.uuid4()), "2026-01")
        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "Enrollment not found")

    @patch("ai.reports.tasks.generate_report_card_task.delay")
    def test_bulk_task_dispatches_one_per_active_enrollment(self, mock_delay):
        other_student = User.objects.create_user(
            email="student2@test.com",
            password="testpass123",
            full_name="Sara Khaled",
            role="S",
            educational_level=7,
            phone="01000000002",
            academy=self.academy,
        )
        other_enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=other_student,
            start_date=date(2026, 1, 1),
            status="active",
        )
        dropped_student = User.objects.create_user(
            email="student3@test.com",
            password="testpass123",
            full_name="Dropped Student",
            role="S",
            educational_level=7,
            phone="01000000003",
            academy=self.academy,
        )
        Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=dropped_student,
            start_date=date(2026, 1, 1),
            status="dropped",
        )

        result = generate_class_reports_task(str(self.class_obj.id), "2026-01")

        self.assertEqual(result["queued"], 2)  # only active enrollments
        self.assertEqual(mock_delay.call_count, 2)


class GenerateBulkReportEndpointTest(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.academy = Academy.objects.create(
            name="Test Academy", email="test@academy.com", phone="01000000000"
        )
        self.owner = User.objects.create_user(
            email="owner@test.com",
            password="testpass123",
            full_name="Owner",
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
        Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student,
            start_date=date(2026, 1, 1),
            status="active",
        )
        self.client.force_authenticate(user=self.owner)

    @patch("ai.reports.views.generate_class_reports_task.delay")
    def test_generate_bulk_as_owner(self, mock_delay):
        response = self.client.post(
            "/api/reports/generate_bulk/",
            {"class_id": str(self.class_obj.id), "month": "2026-01"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data["students_queued"], 1)
        mock_delay.assert_called_once_with(str(self.class_obj.id), "2026-01")

    def test_generate_bulk_as_teacher_forbidden(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(
            "/api/reports/generate_bulk/",
            {"class_id": str(self.class_obj.id), "month": "2026-01"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_generate_bulk_class_not_found(self):
        import uuid
        response = self.client.post(
            "/api/reports/generate_bulk/",
            {"class_id": str(uuid.uuid4()), "month": "2026-01"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_generate_bulk_no_active_students(self):
        empty_class = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Empty Class",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 6, 1),
            session_count=10,
            session_price=50,
        )
        response = self.client.post(
            "/api/reports/generate_bulk/",
            {"class_id": str(empty_class.id), "month": "2026-01"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)