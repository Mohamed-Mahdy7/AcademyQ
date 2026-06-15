import logging
from datetime import date
from django.utils import timezone
from ai.utils.gemini_client import generate_text
from ai.utils.prompt_builder import build_payment_reminder_prompt
from ai.utils.rag_engine import get_student_context
from financial_operations.models import Payment
from .models import Notification
from .services.infobip_sms import send_sms_infobip
from django.conf import settings

logger = logging.getLogger(__name__)


def send_payment_reminder(payment_id: str) -> dict:
    """
    Sends a payment reminder for a single overdue payment.
    Called by the Celery task or manually.
    Returns a result dict with success/failure info.
    """
    try:
        payment = Payment.objects.select_related(
            'enrollment_id__student_id',
            'enrollment_id__class_id',
        ).get(id=payment_id)

        student = payment.enrollment_id.student_id
        enrollment = payment.enrollment_id
        class_obj = enrollment.class_id

        # Get student context from RAG engine
        student_context = get_student_context(str(student.id))

        # Build the reminder prompt
        prompt = build_payment_reminder_prompt({
            "student_name": student.full_name,
            "parent_name": "Parent",
            "outstanding_balance": f"{class_obj.session_count * class_obj.session_price} EGP"
                if class_obj.session_count and class_obj.session_price else "Unknown",
            "due_date": str(payment.due_date) if payment.due_date else "Not specified",
        })

        # Generate message using Gemini
        message = generate_text(prompt)

        # Create notification record
        notification = Notification.objects.create(
            student=student,
            enrollment=enrollment,
            channel='sms',
            notification_type='payment_reminder',
            message=message,
            status='pending',
        )

        # Send via Twilio or mock
        delivery_status = _send_sms(
            phone=student.parent_phone or student.phone,
            message=message,
        )

        # Update status based on delivery result
        notification.status = delivery_status
        notification.sent_at = timezone.now()
        notification.save()

        logger.info(
            "Payment reminder sent | student=%s | payment=%s | status=%s",
            student.full_name, payment_id, delivery_status
        )

        return {
            "success": True,
            "notification_id": str(notification.id),
            "status": delivery_status,
            "student": student.full_name,
        }

    except Payment.DoesNotExist:
        logger.error("Payment not found | payment_id=%s", payment_id)
        return {"success": False, "error": "Payment not found"}

    except Exception as exc:
        logger.error(
            "Payment reminder failed | payment_id=%s | error=%s",
            payment_id, str(exc)
        )
        return {"success": False, "error": str(exc)}


def send_overdue_reminders(academy_id: str) -> dict:
    """
    Finds all overdue payments for an academy and sends reminders.
    Called by Celery beat on a schedule.
    """
    today = date.today()
    results = {"sent": 0, "failed": 0, "skipped": 0}

    # Find all pending payments past their due date
    overdue_payments = Payment.objects.filter(
        enrollment_id__class_id__academy_id=academy_id,
        status='pending',
        due_date__lt=today,
    ).select_related(
        'enrollment_id__student_id',
        'enrollment_id__class_id',
    )

    if not overdue_payments.exists():
        logger.info("No overdue payments found | academy=%s", academy_id)
        return results

    for payment in overdue_payments:
        student = payment.enrollment_id.student_id

        # Skip if no phone number
        phone = student.parent_phone or student.phone
        if not phone:
            logger.warning(
                "Skipping reminder — no phone | student=%s", student.full_name
            )
            results["skipped"] += 1
            continue

        # Skip if reminder already sent today
        already_sent = Notification.objects.filter(
            enrollment=payment.enrollment_id,
            notification_type='payment_reminder',
            sent_at__date=today,
        ).exists()

        if already_sent:
            logger.info(
                "Reminder already sent today | student=%s", student.full_name
            )
            results["skipped"] += 1
            continue

        result = send_payment_reminder(str(payment.id))
        if result["success"]:
            results["sent"] += 1
        else:
            results["failed"] += 1

    logger.info(
        "Overdue reminders complete | academy=%s | %s",
        academy_id, results
    )
    return results


def _send_sms(phone: str, message: str) -> str:

    try:
        result = send_sms_infobip(phone, message)

        print("[INFOBIP_SMS_SENT]", result)

        return result

    except Exception as e:
        print("[INFOBIP_SMS_ERROR]", str(e))
        return None

def normalize_eg_phone(phone):
    if phone.startswith("0"):
        return "2" + phone
    if phone.startswith("+"):
        return phone[1:]
    return phone