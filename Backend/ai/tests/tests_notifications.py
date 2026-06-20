from django.test import TestCase
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
import uuid

from financial_operations.models import Payment, Enrollment
from ai.notifications.models import Notification
from ai.notifications.reminder_tasks import send_payment_reminder, send_overdue_reminders


class PaymentReminderTest(TestCase):

    def setUp(self):
        """Set up test data — runs before each test."""
        from core.models import Academy, User, Students
        from structure.models import Class, Subject

        # Create academy
        self.academy = Academy.objects.create(
            name="Test Academy",
            email="test@academy.com",
            phone="01012345678",
        )

        # Create student user
        self.student_user = User.objects.create_user(
            email="student@test.com",
            password="test1234",
            full_name="Ahmed Test",
            phone="01011111111",
            role=User.Roles.STUDENT,
            academy=self.academy,
        )
        self.student = Students.objects.create(
            user=self.student_user,
            academy=self.academy,
            parent_email="parent@test.com",
            educational_level=1,
            status="A",
        )

        # Create subject
        self.subject = Subject.objects.create(
            academy=self.academy,
            name="Math",
            description="Mathematics",
        )

        # Create class
        self.class_obj = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Math G7",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=90),
            session_count=5,
            session_price=500,
            session_duration=__import__('datetime').timedelta(hours=1),
        )

        # Create enrollment
        self.enrollment = Enrollment.objects.create(
            class_id=self.class_obj,
            student_id=self.student,
            start_date=date.today(),
            status='active',
        )

        # Create overdue payment
        self.overdue_payment = Payment.objects.create(
            enrollment_id=self.enrollment,
            amount=2500,
            due_date=date.today() - timedelta(days=5),  # 5 days overdue
            paid_on=None,
            status='pending',
        )

    # ─────────────────────────────────────────────
    # Test 1 — Notification model creates correctly
    # ─────────────────────────────────────────────
    def test_notification_model_creates(self):
        notification = Notification.objects.create(
            student=self.student,
            enrollment=self.enrollment,
            channel='sms',
            notification_type='payment_reminder',
            message='Test reminder message',
            status='pending',
        )
        self.assertEqual(Notification.objects.count(), 1)
        self.assertEqual(notification.student, self.student)
        self.assertEqual(notification.status, 'pending')
        print("✅ Test 1 passed — Notification model creates correctly")

    # ─────────────────────────────────────────────
    # Test 2 — send_payment_reminder with mock AI
    # ─────────────────────────────────────────────
    @patch('ai.notifications.reminder_tasks.generate_text')
    @patch('ai.notifications.reminder_tasks._send_sms')
    def test_send_payment_reminder_success(self, mock_sms, mock_ai):
        mock_ai.return_value = "Dear Parent, your payment of 2500 EGP is overdue."
        mock_sms.return_value = 'sent'

        result = send_payment_reminder(str(self.overdue_payment.id))

        self.assertTrue(result['success'])
        self.assertEqual(result['status'], 'sent')
        self.assertEqual(Notification.objects.count(), 1)

        notification = Notification.objects.first()
        self.assertEqual(notification.status, 'sent')
        self.assertEqual(notification.notification_type, 'payment_reminder')
        print("✅ Test 2 passed — send_payment_reminder succeeds with mock AI")

    # ─────────────────────────────────────────────
    # Test 3 — payment not found returns error
    # ─────────────────────────────────────────────
    def test_send_payment_reminder_not_found(self):
        fake_id = str(uuid.uuid4())
        result = send_payment_reminder(fake_id)

        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Payment not found')
        self.assertEqual(Notification.objects.count(), 0)
        print("✅ Test 3 passed — returns error for non-existent payment")

    # ─────────────────────────────────────────────
    # Test 4 — SMS fails, notification marked failed
    # ─────────────────────────────────────────────
    @patch('ai.notifications.reminder_tasks.generate_text')
    @patch('ai.notifications.reminder_tasks._send_sms')
    def test_send_payment_reminder_sms_fails(self, mock_sms, mock_ai):
        mock_ai.return_value = "Dear Parent, your payment is overdue."
        mock_sms.return_value = 'failed'

        result = send_payment_reminder(str(self.overdue_payment.id))

        self.assertTrue(result['success'])
        self.assertEqual(result['status'], 'failed')

        notification = Notification.objects.first()
        self.assertEqual(notification.status, 'failed')
        print("✅ Test 4 passed — SMS failure marks notification as failed")

    # ─────────────────────────────────────────────
    # Test 5 — send_overdue_reminders finds and sends
    # ─────────────────────────────────────────────
    @patch('ai.notifications.reminder_tasks.generate_text')
    @patch('ai.notifications.reminder_tasks._send_sms')
    def test_send_overdue_reminders(self, mock_sms, mock_ai):
        mock_ai.return_value = "Dear Parent, your payment is overdue."
        mock_sms.return_value = 'sent'

        results = send_overdue_reminders(str(self.academy.id))

        self.assertEqual(results['sent'], 1)
        self.assertEqual(results['failed'], 0)
        self.assertEqual(results['skipped'], 0)
        self.assertEqual(Notification.objects.count(), 1)
        print("✅ Test 5 passed — send_overdue_reminders sends 1 reminder")

    # ─────────────────────────────────────────────
    # Test 6 — no duplicate reminders same day
    # ─────────────────────────────────────────────
    @patch('ai.notifications.reminder_tasks.generate_text')
    @patch('ai.notifications.reminder_tasks._send_sms')
    def test_no_duplicate_reminders_same_day(self, mock_sms, mock_ai):
        mock_ai.return_value = "Dear Parent, your payment is overdue."
        mock_sms.return_value = 'sent'

        # Run twice
        send_overdue_reminders(str(self.academy.id))
        results = send_overdue_reminders(str(self.academy.id))

        # Second run should skip
        self.assertEqual(results['skipped'], 1)
        self.assertEqual(Notification.objects.count(), 1)  # only 1 created
        print("✅ Test 6 passed — no duplicate reminders on the same day")

    # ─────────────────────────────────────────────
    # Test 7 — student with no phone is skipped
    # ─────────────────────────────────────────────
    @patch('ai.notifications.reminder_tasks.generate_text')
    @patch('ai.notifications.reminder_tasks._send_sms')
    def test_skips_student_with_no_phone(self, mock_sms, mock_ai):
        # Remove phone numbers
        self.student.phone = ""
        self.student.parent_phone = ""
        self.student.save()

        results = send_overdue_reminders(str(self.academy.id))

        self.assertEqual(results['skipped'], 1)
        self.assertEqual(results['sent'], 0)
        self.assertEqual(Notification.objects.count(), 0)
        print("✅ Test 7 passed — student with no phone is skipped")