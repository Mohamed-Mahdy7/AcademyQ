from celery import shared_task
from django.utils import timezone
import logging

from financial_operations.models import Enrollment
from ai.agent.helpers.risk_scorer import risk_scorer
from ai.agent.helpers.context_builder import build_risk_context
from ai.agent.helpers.alert_creator import create_alert_if_needed
from ai.agent.models import Alert

logger = logging.getLogger(__name__)

SCHEDULED_SCAN_TRIGGER = "scheduled"
MANUAL_SCAN_TRIGGER = "manual"


def run_risk_scan(academy_id, scan_log):
    """
    Core scan logic — shared between the Celery task and the manual trigger endpoint.
    Iterates over all active enrollments for the academy, runs the risk scorer,
    and creates/updates alerts accordingly.
    """
    
    enrollments = Enrollment.objects.filter(
        class_id__academy_id=academy_id,
        status="active",
    ).select_related("class_id", "student_id__user")

    students_scanned = 0
    alerts_created_count = 0
    alerts_updated_count = 0
    errors = 0
    error_log = []

    for enrollment in enrollments:
        try:
            context = build_risk_context(enrollment.id)
            result = risk_scorer(context)

            alert, action = create_alert_if_needed(enrollment.id, result)
            if action == "created":
                alerts_created_count += 1
            elif action == "updated":
                alerts_updated_count += 1

            students_scanned += 1

        except Exception as e:
            errors += 1
            error_log.append(
                f"enrollment {enrollment.id}: {str(e)}"
            )
            logger.error(
                f"Risk scan error for enrollment {enrollment.id}: {e}",
                exc_info=True,
            )
            continue  # never let one failure abort the whole scan

    scan_log.students_scanned = students_scanned
    scan_log.alerts_created = alerts_created_count
    scan_log.alerts_updated = alerts_updated_count
    scan_log.errors = errors
    scan_log.error_log = "\n".join(error_log)
    scan_log.status = "complete" if errors == 0 else "complete"  # always complete, errors logged
    scan_log.completed_at = timezone.now()
    scan_log.save()

    return {
        "students_scanned": students_scanned,
        "alerts_created": alerts_created_count,
        "alerts_updated": alerts_updated_count,
        "errors": errors,
    }


@shared_task(name="ai.agent.tasks.weekly_student_scan")
def weekly_student_scan():
    """
    Scheduled weekly scan — runs every Sunday at 07:00 Cairo time (04:00 UTC).
    Scans all academies with active subscriptions.
    """
    from core.models import Academy
    from ai.agent.models import ScanLog

    academies = Academy.objects.filter(
        subscription_end__gte=timezone.now().date()
    )

    for academy in academies:
        scan_log = ScanLog.objects.create(
            academy=academy,
            triggered_by=SCHEDULED_SCAN_TRIGGER,
            status="running",
        )
        try:
            run_risk_scan(academy.id, scan_log)
        except Exception as e:
            scan_log.status = "failed"
            scan_log.error_log = str(e)
            scan_log.completed_at = timezone.now()
            scan_log.save()
            logger.error(f"Weekly scan failed for academy {academy.id}: {e}", exc_info=True)