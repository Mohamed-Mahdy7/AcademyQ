from django.utils import timezone
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from financial_operations.models import Enrollment, Payment
from records.models import Attendance
from .retrieval import get_similar_student_context


User = get_user_model()

class StudentContextError(Exception):
    """
    Raised when the student/enrollment pair needed to build AI
    context can't be resolved. Callers (e.g. the weekly scan task)
    should catch this per-student and keep going -- one bad ID
    shouldn't abort a batch of 100.
    """
    pass


def _attendance_rate(total, present):
        return round((present / total) * 100, 2) if total else 0


def get_teacher_notes():
    """
    Placeholder -- no teacher-notes model exists yet. Returning None
    lets prompt_builder's own "No teacher notes available" fallback
    do its job instead of baking a fake note into every prompt.
    """
    return None


def get_student_context(student_id):

    try:
        student = User.objects.get(id=student_id, role=User.Roles.STUDENT)
    except User.DoesNotExist as exc:
        raise StudentContextError(f"No student found for id={student_id}") from exc

    enrollments = list(Enrollment.objects.filter(student_id=student))

    if not enrollments:
        return {
            "student_id": str(student.id),
            "student_name": student.full_name,
            "email": student.email,
            "phone": student.phone,
            "educational_level": student.get_educational_level_display(),
            "attendance_rate": 0,
            "missed_classes": 0,
            "teacher_notes": get_teacher_notes(),
            "payments": [],
            "enrollments": [],
            "enrollment_count": 0,
            "parent_email": student.parent_email,
            "status": student.get_status_display(),
            "similar_students": get_similar_student_context(student),
            "academy_id": str(student.academy_id) if student.academy_id else None,
        }

    # One query for attendance across all enrollments, grouped by
    # enrollment -- instead of one query per enrollment.
    attendance_rows = (
        Attendance.objects
        .filter(enrollment__in=enrollments)
        .values("enrollment_id")
        .annotate(total=Count("id"), present=Count("id", filter=Q(present=True)))
    )
    attendance_by_enrollment = {row["enrollment_id"]: row for row in attendance_rows}

    # One query for the earliest pending payment per enrollment.
    pending_payments = (
        Payment.objects
        .filter(enrollment_id__in=[e.id for e in enrollments], status="pending")
        .order_by("enrollment_id", "due_date")
    )
    earliest_pending_by_enrollment = {}
    for payment in pending_payments:
        earliest_pending_by_enrollment.setdefault(payment.enrollment_id, payment)

    today = timezone.now().date()
    enrollment_contexts = []
    total_sessions = 0
    total_present = 0

    for enrollment in enrollments:
        counts = attendance_by_enrollment.get(enrollment.id, {"total": 0, "present": 0})
        total, present = counts["total"], counts["present"]
        total_sessions += total
        total_present += present

        payment = earliest_pending_by_enrollment.get(enrollment.id)
        overdue_days = max((today - payment.due_date).days, 0) if payment and payment.due_date else 0

        enrollment_contexts.append({
            "enrollment_id": str(enrollment.id),
            "attendance_rate": _attendance_rate(total, present),
            "missed_classes": total - present,
            "payments": {
                "status": "Pending" if payment else "Complete",
                "due_date": payment.due_date if payment else None,
                "overdue_days": overdue_days,
            },
        })

    return {
        "student_id": str(student.id),
        "student_name": student.full_name,
        "email": student.email,
        "phone": student.phone,
        "educational_level": student.get_educational_level_display(),
        "attendance_rate": _attendance_rate(total_sessions, total_present),
        "missed_classes": total_sessions - total_present,
        "teacher_notes": get_teacher_notes(),
        "payments": [e["payments"] for e in enrollment_contexts],
        "enrollments": enrollment_contexts,
        "enrollment_count": len(enrollments),
        "parent_email": student.parent_email,
        "status": student.get_status_display(),
        "similar_students": get_similar_student_context(student),
        "academy_id": str(student.academy_id) if student.academy_id else None,
    }