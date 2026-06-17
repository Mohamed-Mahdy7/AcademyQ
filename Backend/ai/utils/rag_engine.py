from django.utils import timezone
from django.contrib.auth import get_user_model
from financial_operations.models import Enrollment, Payment
from records.models import Attendance
from .retrieval import get_similar_student_context


User = get_user_model()


def calculate_attendance_rate(student):
        total = Attendance.objects.filter(
            enrollment__student_id=student
        ).count()

        present = Attendance.objects.filter(
            enrollment__student_id=student,
            present=True
        ).count()

        if total == 0:
            return 0

        return round((present / total) * 100, 2)


def calculate_missed_classes(student):
    return Attendance.objects.filter(
        enrollment__student_id=student,
        present=False
    ).count()


def get_payment_status(student):

    payment = Payment.objects.filter(
        enrollment_id__student_id=student,
        status="pending"
    ).order_by("due_date").first()
    

    return {
        "status": "Pending" if payment else "Complete",
        "due_date": payment.due_date if payment else None
    }

def get_teacher_notes(student):
    """
    Placeholder for future teacher notes.
    """
    return "This is where the teacher notes will appear"


def get_student_context(student_id):

    student = User.objects.get(
        id=student_id,
        role=User.Roles.STUDENT
    )

    attendance_rate = calculate_attendance_rate(student)
    missed_classes = calculate_missed_classes(student)
    payment = get_payment_status(student)
    teacher_notes = get_teacher_notes(student)
    similar_students = get_similar_student_context(student)
    enrollments = Enrollment.objects.filter(
        student_id=student
    )

    overdue_days = 0
    if payment["due_date"]:
        overdue_days = (timezone.now().date() - payment["due_date"]).days
        overdue_days = max(overdue_days, 0)

    return {
        "student_id": str(student.id),
        "student_name": student.full_name,
        "email": student.email,
        "phone": student.phone,
        "educational_level": student.get_educational_level_display(),
        "attendance_rate": attendance_rate,
        "missed_classes": missed_classes,
        "teacher_notes": teacher_notes,
        "payment_status": payment["status"],
        "overdue_days": overdue_days,
        "enrollment_count": enrollments.count(),
        "parent_phone": student.parent_phone,
        "status": student.get_status_display(),
        "similar_students": similar_students,
        "academy_id": str(student.academy_id) if student.academy_id else None,
    }