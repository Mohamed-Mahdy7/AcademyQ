import logging
from datetime import date, timedelta
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


def send_sms(to_number: str, body: str) -> bool:
    """
    Sends SMS via Twilio.
    If Twilio keys are not set yet, just logs to console (safe for dev).
    """
    if not settings.TWILIO_ACCOUNT_SID:
        logger.info("[MOCK_SMS] To: %s | Body: %s", to_number, body)
        return True

    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=body,
            from_=settings.TWILIO_FROM_NUMBER,
            to=to_number,
        )
        return True
    except Exception as exc:
        logger.error("Twilio send failed | to=%s | error=%s", to_number, str(exc))
        return False


def build_reminder_message(student_name: str, amount: str, due_date: str, days_overdue: int) -> str:
    """
    Builds the payment reminder message text.
    TODO: replace with generate_text(build_payment_reminder_prompt(context))
          once Mahdy ships ai/utils/ at end of Sprint 7 Week 1.
    """
    return (
        f"Dear Parent of {student_name}, "
        f"this is a friendly reminder that a payment of {amount} EGP "
        f"was due on {due_date} ({days_overdue} days ago). "
        f"Please contact us at your earliest convenience. "
        f"Thank you for your cooperation."
    )


def send_payment_reminders():
    """
    Core logic — finds all overdue payments and sends reminders
    on day 0, day 3, and day 7 after the due date.

    How to test right now (no Celery needed):
        python manage.py shell
        from ai.notifications.reminder_tasks import send_payment_reminders
        send_payment_reminders()
    """
    from financial_operations.models import Payment
    from ai.notifications.models import Notification

    today = date.today()

    # We send reminders exactly on day 0, day 3, and day 7
    reminder_days = [0, 3, 7]
    target_dates = [today - timedelta(days=d) for d in reminder_days]

    # Get all pending payments whose due date matches one of our target dates
    overdue_payments = Payment.objects.filter(
        status="pending",
        due_date__in=target_dates,
    ).select_related(
        "enrollment_id__student_id",
        "enrollment_id",
    )

    logger.info(
        "Payment reminder task started | found %s overdue payments",
        overdue_payments.count()
    )

    sent_count = 0
    failed_count = 0

    for payment in overdue_payments:
        student = payment.enrollment_id.student_id
        parent_phone = student.parent_phone

        # Skip if student has no parent phone
        if not parent_phone:
            logger.warning(
                "No parent phone for student %s — skipping",
                student.id
            )
            continue

        days_overdue = (today - payment.due_date).days

        # Build the message
        message = build_reminder_message(
            student_name=student.full_name,
            amount=str(payment.amount),
            due_date=str(payment.due_date),
            days_overdue=days_overdue,
        )

        # Avoid sending duplicate reminders on the same day
        already_sent = Notification.objects.filter(
            student=student,
            enrollment=payment.enrollment_id,
            notification_type="payment_reminder",
            created_at__date=today,
        ).exists()

        if already_sent:
            logger.info(
                "Reminder already sent today for student %s — skipping",
                student.id
            )
            continue

        # Send the SMS
        success = send_sms(to_number=parent_phone, body=message)

        # Save a record in the Notification table no matter what
        Notification.objects.create(
            student=student,
            enrollment=payment.enrollment_id,
            notification_type="payment_reminder",
            channel="sms",
            status="sent" if success else "failed",
            message=message,
            recipient_phone=parent_phone,
            sent_at=timezone.now() if success else None,
        )

        if success:
            sent_count += 1
        else:
            failed_count += 1

    logger.info(
        "Payment reminder task finished | sent=%s | failed=%s",
        sent_count,
        failed_count,
    )


# ── Celery task wrapper ────────────────────────────────────────────────────
# Mahdy owns the Celery setup — once he ships it (end of Sprint 7 Week 1),
# this decorator activates and the task runs automatically every day.
# Until then, call send_payment_reminders() directly from the shell to test.

try:
    from celery import shared_task

    @shared_task(name="ai.notifications.send_payment_reminders")
    def send_payment_reminders_task():
        send_payment_reminders()

except ImportError:
    logger.warning("Celery not installed yet — task runs as plain function only")