import logging
from celery import shared_task

from financial_operations.models import Enrollment
from .generator import generate_report_card

logger = logging.getLogger(__name__)


@shared_task(name="ai.reports.tasks.generate_report_card_task")
def generate_report_card_task(enrollment_id: str, month: str):
    try:
        enrollment = Enrollment.objects.select_related("student_id", "class_id").get(
            id=enrollment_id
        )
    except Enrollment.DoesNotExist:
        logger.error(
            "generate_report_card_task: enrollment not found | id=%s",
            enrollment_id,
        )
        return {"success": False, "error": "Enrollment not found"}

    try:
        report = generate_report_card(enrollment, month)
        logger.info(
            "Report generated | enrollment=%s | month=%s | risk=%s",
            enrollment_id,
            month,
            report.risk_level,
        )
        return {"success": True, "report_id": str(report.id)}
    except Exception as exc:
        logger.error(
            "generate_report_card_task failed | enrollment=%s | error=%s",
            enrollment_id,
            str(exc),
        )
        return {"success": False, "error": str(exc)}


@shared_task(name="ai.reports.tasks.generate_class_reports_task")
def generate_class_reports_task(class_id: str, month: str):
    """
    Dispatches one generate_report_card_task per active enrollment in the class.
    """
    enrollment_ids = list(
        Enrollment.objects.filter(class_id=class_id, status="active").values_list(
            "id", flat=True
        )
    )

    for enrollment_id in enrollment_ids:
        generate_report_card_task.delay(str(enrollment_id), month)

    logger.info(
        "Queued class report generation | class=%s | month=%s | count=%s",
        class_id,
        month,
        len(enrollment_ids),
    )
    return {"queued": len(enrollment_ids)}
