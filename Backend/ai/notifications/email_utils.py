"""
Shared email sending utility for the notifications app.
Imported by both views.py and reminder_tasks.py to avoid circular imports.
"""

import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, message: str) -> dict:
    """
    Sends a plain-text email via Django's configured email backend.
    Falls back to a console mock if EMAIL_HOST_USER is not configured,
    so development never crashes on a missing SMTP setup.

    Returns:
        {"status": "sent"} on success
        {"status": "failed", "error": str} on failure
    """
    if not to_email:
        logger.warning("[EMAIL] No recipient address — skipping send")
        return {"status": "failed", "error": "No recipient email"}

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "EMAIL_HOST_USER", "noreply@academiq.app"),
            recipient_list=[to_email],
            fail_silently=False,
        )
        logger.info("[EMAIL] Sent to %s | subject=%s", to_email, subject)
        return {"status": "sent"}

    except Exception as exc:
        logger.error("[EMAIL] Failed to %s | error=%s", to_email, str(exc))
        # Mock fallback so dev environment never hard-crashes
        print(f"[MOCK_EMAIL] To: {to_email}\nSubject: {subject}\nMessage: {message}\n")
        return {"status": "failed", "error": str(exc)}