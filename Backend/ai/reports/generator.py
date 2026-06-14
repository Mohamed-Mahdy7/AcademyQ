from datetime import date

from financial_operations.models import Enrollment
from ai.utils.prompt_builder import build_report_prompt
from ai.utils.gemini_client import generate_text
from .models import AIReportCard


def _parse_month(month: str):
    """'YYYY-MM' -> (year, month_int)"""
    year, month_num = month.split("-")
    return int(year), int(month_num)


def _get_attendance_stats(enrollment, year, month_num):
    records = enrollment.attendance_records.filter(
        session__session_date__year=year,
        session__session_date__month=month_num,
    )
    total = records.count()
    present = records.filter(present=True).count()
    missed = total - present
    attendance_rate = round((present / total) * 100, 1) if total > 0 else 0.0
    return attendance_rate, missed, records


def _get_payment_status(enrollment):
    payment = (
        enrollment.payments
        .exclude(status="deleted")
        .order_by("-due_date")
        .first()
    )
    if not payment:
        return "unknown"
    if payment.status == "completed":
        return "paid"
    if payment.status == "pending":
        if payment.due_date and payment.due_date < date.today():
            return "overdue"
        return "pending"
    return payment.status


def _get_teacher_notes(records):
    notes = [
        r.session.notes.strip()
        for r in records.select_related("session")
        if r.session.notes
    ]
    return "\n".join(notes) if notes else "No teacher notes available"


def _calculate_risk(attendance_rate, payment_status):
    payment_score = 0 if payment_status == "paid" else 100
    risk_score = round((100 - attendance_rate) * 0.6 + payment_score * 0.4)
    risk_score = max(0, min(100, risk_score))

    if risk_score >= 60:
        risk_level = "high"
    elif risk_score >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"

    return risk_score, risk_level


def generate_report_card(enrollment: Enrollment, month: str) -> AIReportCard:
    """
    Generate or regenerate an AIReportCard for an enrollment + month ('YYYY-MM').
    """
    year, month_num = _parse_month(month)
    student = enrollment.student_id

    attendance_rate, missed_classes, records = _get_attendance_stats(
        enrollment, year, month_num
    )
    payment_status = _get_payment_status(enrollment)
    teacher_notes = _get_teacher_notes(records)

    context = {
        "student_name": student.full_name,
        "educational_level": student.get_educational_level_display(),
        "attendance_rate": attendance_rate,
        "missed_classes": missed_classes,
        "payment_status": payment_status,
        "teacher_notes": teacher_notes,
    }

    prompt = build_report_prompt(context)
    summary_text = generate_text(prompt)

    risk_score, risk_level = _calculate_risk(attendance_rate, payment_status)

    report, _ = AIReportCard.objects.update_or_create(
        enrollment=enrollment,
        month=month,
        defaults={
            "student": student,
            "summary_text": summary_text,
            "risk_level": risk_level,
            "risk_score": risk_score,
        },
    )
    return report