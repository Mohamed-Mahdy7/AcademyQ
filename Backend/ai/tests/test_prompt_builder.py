from django.test import SimpleTestCase

from ai.utils.prompt_builder import (
    format_similar_students,
    format_payment_status,
    build_report_prompt,
    build_risk_alert_prompt,
    build_payment_reminder_prompt,
    build_management_summary_prompt,
    build_custom_prompt,
)


class FormatSimilarStudentsTest(SimpleTestCase):

    def test_empty_returns_none_text(self):
        self.assertEqual(format_similar_students({}), "None")
        self.assertEqual(format_similar_students({"similar_students": []}), "None")

    def test_formats_each_student(self):
        context = {"similar_students": [
            {"student_name": "Ahmed", "educational_level": "Grade 9"},
            {"student_name": "Sara", "educational_level": "Grade 10"},
        ]}
        result = format_similar_students(context)
        self.assertIn("- Ahmed (Grade 9)", result)
        self.assertIn("- Sara (Grade 10)", result)


class FormatPaymentStatusTest(SimpleTestCase):

    def test_no_enrollments(self):
        self.assertEqual(format_payment_status({}), "No active enrollments")
        self.assertEqual(format_payment_status({"payment_status": []}), "No active enrollments")

    def test_mixed_statuses_across_enrollments(self):
        context = {"payment_status": [
            {"status": "Complete", "due_date": None, "overdue_days": 0},
            {"status": "Pending", "due_date": "2026-06-01", "overdue_days": 12},
            {"status": "Pending", "due_date": "2026-07-01", "overdue_days": 0},
        ]}
        result = format_payment_status(context)
        self.assertIn("Enrollment 1: Complete", result)
        self.assertIn("Enrollment 2: Pending — 12 day(s) overdue", result)
        self.assertIn("Enrollment 3: Pending — due 2026-07-01", result)


class BuildReportPromptTest(SimpleTestCase):

    def test_includes_core_fields(self):
        context = {
            "student_name": "Ahmed",
            "attendance_rate": 65,
            "missed_classes": 4,
            "payment_status": [{"status": "Pending", "due_date": "2026-06-01", "overdue_days": 12}],
            "teacher_notes": None,
        }
        prompt = build_report_prompt(context)
        self.assertIn("Ahmed", prompt)
        self.assertIn("No teacher notes available", prompt)
        self.assertIn("Pending — 12 day(s) overdue", prompt)


class BuildRiskAlertPromptTest(SimpleTestCase):

    def test_includes_risk_score(self):
        prompt = build_risk_alert_prompt({"student_name": "Sara", "risk_score": 75, "payment_status": []})
        self.assertIn("Sara", prompt)
        self.assertIn("75", prompt)


class BuildPaymentReminderPromptTest(SimpleTestCase):

    def test_includes_balance_and_due_date(self):
        prompt = build_payment_reminder_prompt({
            "student_name": "Omar", "parent_name": "Mr. Hassan",
            "outstanding_balance": 400, "due_date": "2026-06-20",
        })
        self.assertIn("400", prompt)
        self.assertIn("2026-06-20", prompt)


class BuildManagementSummaryPromptTest(SimpleTestCase):

    def test_includes_metrics(self):
        prompt = build_management_summary_prompt({
            "reports_generated": 10, "alerts_generated": 3,
            "notifications_sent": 25, "estimated_cost": 1.23,
        })
        self.assertIn("10", prompt)
        self.assertIn("1.23", prompt)


class BuildCustomPromptTest(SimpleTestCase):

    def test_assembles_role_instructions_and_context(self):
        prompt = build_custom_prompt(
            system_role="QA tester", instructions="Summarize", context={"key": "value"},
        )
        self.assertIn("QA tester", prompt)
        self.assertIn("key: value", prompt)