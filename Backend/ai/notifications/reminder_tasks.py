"""
Payment reminder tasks for the notifications app.
Triggered manually via POST /api/notifications/send-reminders/
or scheduled via Celery beat (AQ-073).
"""

import logging
from datetime import date

from django.utils import timezone

from ai.utils.gemini_client import generate_text
from ai.utils.prompt_builder import build_payment_reminder_prompt
from financial_operations.models import Payment
from .models import Notification
from .email_utils import send_email  # shared helper — no circular import

logger = logging.getLogger(__name__)


def send_payment_reminder(payment_id: str) -> dict:
    """
    Generate and send a payment reminder for a single Payment row.

    Steps:
        1. Load the Payment with related student + class data.
        2. Build the prompt and call Gemini to generate the message.
        3. Create a Notification row (status=pending).
        4. Send email to parent_email (fallback: student email).
        5. Update notification status to sent/failed.

    Returns a result dict with success, notification_id, status, student name.
    """
    try:
        payment = Payment.objects.select_related(
            "enrollment_id__student_id",
            "enrollment_id__class_id",
        ).get(id=payment_id)

        student = payment.enrollment_id.student_id
        enrollment = payment.enrollment_id
        class_obj = enrollment.class_id

        outstanding = (
            f"{class_obj.session_count * class_obj.session_price} EGP"
            if class_obj.session_count and class_obj.session_price
            else "Unknown"
        )

        prompt = build_payment_reminder_prompt({
            "student_name": student.full_name,
            "parent_name": "Parent",
            "outstanding_balance": outstanding,
            "due_date": str(payment.due_date) if payment.due_date else "Not specified",
        })

        message = generate_text(prompt)

        notification = Notification.objects.create(
            student=student,
            enrollment=enrollment,
            alert=None,  # payment reminders are not linked to an Alert row
            channel="email",
            notification_type="payment_reminder",
            message=message,
            status="pending",
        )

        recipient = getattr(student, "parent_email", None) or student.email
        result = send_email(
            to_email=recipient,
            subject=f"AcademiQ — Payment reminder for {student.full_name}",
            message=message,
        )

        notification.status = result["status"]
        notification.sent_at = timezone.now() if result["status"] == "sent" else None
        notification.save(update_fields=["status", "sent_at"])

        return {
            "success": True,
            "notification_id": str(notification.id),
            "status": result["status"],
            "student": student.full_name,
        }

    except Payment.DoesNotExist:
        logger.error("send_payment_reminder: Payment %s not found", payment_id)
        return {"success": False, "error": "Payment not found"}

    except Exception as exc:
        logger.error(
            "send_payment_reminder: Failed for payment %s | %s",
            payment_id,
            str(exc),
        )
        return {"success": False, "error": str(exc)}


def send_overdue_reminders(academy_id: str) -> dict:
    """
    Send payment reminders for all overdue pending payments in an academy.

    Dedup rule: skip if a payment_reminder notification was already sent
    today for the same enrollment (prevents double-sending on manual retrigger).

    Returns counts: { sent, failed, skipped }
    """
    today = date.today()
    results = {"sent": 0, "failed": 0, "skipped": 0}

    overdue_payments = Payment.objects.filter(
        enrollment_id__class_id__academy_id=academy_id,
        status="pending",
        due_date__lt=today,
    ).select_related(
        "enrollment_id__student_id",
        "enrollment_id__class_id",
    )

    if not overdue_payments.exists():
        logger.info(
            "send_overdue_reminders: No overdue payments for academy %s", academy_id
        )
        return results

    for payment in overdue_payments:
        student = payment.enrollment_id.student_id
        recipient = getattr(student, "parent_email", None) or student.email

        if not recipient:
            logger.warning(
                "send_overdue_reminders: No email for student %s — skipping",
                student.id,
            )
            results["skipped"] += 1
            continue

        # Dedup: only one reminder per enrollment per day
        already_sent = Notification.objects.filter(
            enrollment=payment.enrollment_id,
            notification_type="payment_reminder",
            sent_at__date=today,
        ).exists()

        if already_sent:
            results["skipped"] += 1
            continue

        result = send_payment_reminder(str(payment.id))
        if result["success"]:
            results["sent"] += 1
        else:
            results["failed"] += 1

    return results