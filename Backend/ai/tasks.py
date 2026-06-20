import logging
from decimal import Decimal
from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db.models import Count, Q, Sum
from django.template.loader import render_to_string
from django.utils import timezone
from ai.models import AIUsageLog
from ai.utils.gemini_client import generate_text
from ai.utils.prompt_builder import build_management_summary_prompt

logger = logging.getLogger(__name__)


def _collect_weekly_metrics(academy):
    now = timezone.now()
    week_start = now - timezone.timedelta(days=7)

    ai_summary = AIUsageLog.objects.filter(
        academy=academy,
        called_at__gte=week_start,
    ).aggregate(
        total_calls=Count("id"),
        total_cost=Sum("total_cost_usd"),
        cache_hits=Count("id", filter=Q(cache_hit=True)),
    )

    reports_generated = 0
    try:
        from ai.reports.models import AIReportCard
        reports_generated = AIReportCard.objects.filter(
            student__academy=academy,
            generated_at__gte=week_start,
        ).count()
    except ImportError:
        pass  # model genuinely doesn't exist yet — expected
    
    except Exception as exc:
        logger.warning("Reports metric failed unexpectedly: %s", exc)

    alerts_generated = 0
    try:
        from ai.agent.models import Alert
        alerts_generated = Alert.objects.filter(
            enrollment__class_id__academy_id=academy.id,
            created_at__gte=week_start,
        ).count()
    except Exception:
        pass

    notifications_sent = 0
    try:
        from ai.notifications.models import Notification
        notifications_sent = Notification.objects.filter(
            student__academy=academy,
            sent_at__gte=week_start,
            status="sent",
        ).count()
    except Exception:
        pass

    return {
        "reports_generated": reports_generated,
        "alerts_generated": alerts_generated,
        "notifications_sent": notifications_sent,
        "estimated_cost": float(ai_summary["total_cost"] or Decimal("0")),
        "total_ai_calls": ai_summary["total_calls"] or 0,
        "cache_hits": ai_summary["cache_hits"] or 0,
        "week_start": week_start.strftime("%Y-%m-%d"),
        "week_end": now.strftime("%Y-%m-%d"),
        "academy_name": academy.name,
    }

@shared_task(bind=True, max_retries=3)
def send_weekly_management_report(self):
    """Runs every Sunday 07:00 Cairo time -- one email per academy with weekly_report_enabled=True."""
    from core.models import Academy

    academies = Academy.objects.filter(weekly_report_enabled=True)
    logger.info("Sending weekly reports | academy_count=%s", academies.count())

    for academy in academies:
        try:
            _send_report_for_academy(academy)
        except Exception as exc:
            logger.error("Weekly report failed | academy=%s | error=%s", academy.id, str(exc))
            # one academy failing must never block the rest


def _send_report_for_academy(academy):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    owner = User.objects.filter(academy=academy, role=User.Roles.OWNER).first()
    if not owner or not owner.email:
        logger.warning("No owner email found | academy=%s", academy.id)
        return

    metrics = _collect_weekly_metrics(academy)
    prompt = build_management_summary_prompt(metrics)
    ai_summary = generate_text(prompt, feature="management_report", academy=academy)
    metrics["ai_summary"] = ai_summary

    html_body = render_to_string("ai/weekly_report.html", {"metrics": metrics})
    text_body = f"AcademiQ Weekly Report — {metrics['week_start']} to {metrics['week_end']}\n\n{ai_summary}"

    email = EmailMultiAlternatives(
        subject=f"AcademiQ Weekly Report — {metrics['week_start']}",
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[owner.email],
    )
    email.attach_alternative(html_body, "text/html")
    email.send()

    logger.info("Weekly report sent | academy=%s | owner=%s", academy.id, owner.email)