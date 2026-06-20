from datetime import date
from django.test import TestCase
from django.utils import timezone

from core.models import User, Academy, Students
from structure.models import Subject, Class
from financial_operations.models import Enrollment
from ai.agent.models import Alert
from ai.agent.helpers.alert_creator import create_alert_if_needed


class AlertCreatorTests(TestCase):
    def setUp(self):
        self.academy = Academy.objects.create(
            name="Test Academy", email="academy3@test.com"
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
            email="student3@test.com",
            password="test1234",
            full_name="Test Student 3",
            phone="01000000004",
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
        self.low_result = {
            "risk_level": "low",
            "risk_score": 25,
            "primary_reason": "Average score on recent assessments is 40%.",
            "recommended_action": "Schedule academic check-in with teacher.",
        }
        self.medium_result = {
            "risk_level": "medium",
            "risk_score": 40,
            "primary_reason": "Attendance dropped to 60% over the last 28 days.",
            "recommended_action": "Contact parent/guardian regarding attendance.",
        }
        self.high_result = {
            "risk_level": "high",
            "risk_score": 75,
            "primary_reason": "Attendance dropped to 60% over the last 28 days.",
            "recommended_action": "Urgent: Contact parent/guardian; Send payment reminder.",
        }

    def test_no_existing_alert_creates_new(self):
        alert, action = create_alert_if_needed(self.enrollment.id, self.medium_result)
        self.assertIsNotNone(alert)
        self.assertEqual(Alert.objects.count(), 1)
        self.assertEqual(alert.risk_level, "medium")
        self.assertEqual(alert.risk_score, 40)
        self.assertEqual(action, "created")

    def test_unreviewed_lower_severity_gets_overridden(self):
        create_alert_if_needed(self.enrollment.id, self.low_result)
        alert, action = create_alert_if_needed(self.enrollment.id, self.medium_result)
        self.assertEqual(Alert.objects.count(), 1)
        self.assertEqual(alert.risk_level, "medium")
        self.assertEqual(alert.risk_score, 40)
        self.assertEqual(action, "updated")

    def test_unreviewed_higher_severity_not_downgraded(self):
        create_alert_if_needed(self.enrollment.id, self.high_result)
        alert, action = create_alert_if_needed(self.enrollment.id, self.low_result)
        self.assertEqual(Alert.objects.count(), 1)
        self.assertEqual(alert.risk_level, "high")
        self.assertEqual(alert.risk_score, 75)
        self.assertEqual(action, "skipped")

    def test_unreviewed_same_severity_updates_fields(self):
        create_alert_if_needed(self.enrollment.id, self.medium_result)
        updated_medium = {
            "risk_level": "medium",
            "risk_score": 65,
            "primary_reason": "Updated reason.",
            "recommended_action": "Updated action.",
        }
        alert, action = create_alert_if_needed(self.enrollment.id, updated_medium)
        self.assertEqual(Alert.objects.count(), 1)
        self.assertEqual(alert.risk_score, 65)
        self.assertEqual(alert.primary_reason, "Updated reason.")
        self.assertEqual(action, "updated")

    def test_reviewed_alert_allows_new_alert(self):
        existing, _ = create_alert_if_needed(self.enrollment.id, self.low_result)
        existing.reviewed_at = timezone.now()
        existing.save()

        new_alert, new_action = create_alert_if_needed(self.enrollment.id, self.medium_result)
        self.assertEqual(Alert.objects.count(), 2)
        self.assertEqual(new_alert.risk_level, "medium")
        self.assertEqual(new_action, "created")

    def test_returned_alert_matches_db(self):
        alert, action = create_alert_if_needed(self.enrollment.id, self.high_result)
        db_alert = Alert.objects.get(id=alert.id)
        self.assertEqual(db_alert.risk_level, alert.risk_level)
        self.assertEqual(db_alert.risk_score, alert.risk_score)
        self.assertEqual(action, "created")