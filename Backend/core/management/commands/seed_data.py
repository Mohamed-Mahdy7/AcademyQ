
from django.core.management.base import BaseCommand
from datetime import date, timedelta, time

from decimal import Decimal
import random

from core.models import Academy, User
from structure.models import (
    Subject,
    Class,
    TeacherClass,
    ClassSchedule,
    ClassSessionEnrollment,
)
from financial_operations.models import (
    Teachers,
    Enrollment,
    Payment,
)
from records.models import (
    ClassSession,
    Attendance,
)
from grades.models import Grade


def run():

    print("Cleaning old data...")

    Grade.objects.all().delete()
    Attendance.objects.all().delete()
    ClassSessionEnrollment.objects.all().delete()
    ClassSession.objects.all().delete()
    Payment.objects.all().delete()
    Enrollment.objects.all().delete()
    TeacherClass.objects.all().delete()
    Teachers.objects.all().delete()
    ClassSchedule.objects.all().delete()
    Class.objects.all().delete()
    Subject.objects.all().delete()
    User.objects.exclude(is_superuser=True).delete()
    Academy.objects.all().delete()

    print("Creating academy...")

    academy = Academy.objects.create(
        name="Future Academy",
        email="academy@example.com",
        phone="01000000000",
        address="Tanta",
        subscription_end=date.today() + timedelta(days=365),
        setup_complete=True,
    )

    owner = User.objects.create_user(
        academy=academy,
        full_name="Academy Owner",
        email="owner@example.com",
        password="123456",
        phone="01011111111",
        parent_phone="",
        educational_level=18,
        role=User.Roles.OWNER,
        status=User.Status.ACTIVE,
    )

    admins = []

    print("Creating admins...")

    for i in range(3):
        admin = User.objects.create_user(
            academy=academy,
            full_name=f"Admin {i+1}",
            email=f"admin{i+1}@example.com",
            password="123456",
            phone=f"010200000{i}",
            parent_phone="",
            educational_level=18,
            role=User.Roles.ADMIN,
            status=User.Status.ACTIVE,
        )
        admins.append(admin)

    print("Creating teachers...")

    teacher_profiles = []

    for i in range(20):
        teacher_user = User.objects.create_user(
            academy=academy,
            full_name=f"Teacher {i+1}",
            email=f"teacher{i+1}@example.com",
            password="123456",
            phone=f"0111000{i:04d}",
            parent_phone="",
            educational_level=18,
            role=User.Roles.TEACHER,
            status=User.Status.ACTIVE,
        )

        teacher_profile = Teachers.objects.create(
            academy_id=academy,
            user_id=teacher_user,
        )

        teacher_profiles.append(teacher_profile)

    print("Creating students...")

    students = []

    for i in range(100):

        level = random.choice([
            User.EducationalLevel.PREP_1,
            User.EducationalLevel.PREP_2,
            User.EducationalLevel.PREP_3,
            User.EducationalLevel.SEC_1,
            User.EducationalLevel.SEC_2,
            User.EducationalLevel.SEC_3,
        ])

        student = User.objects.create_user(
            academy=academy,
            full_name=f"Student {i+1}",
            email=f"student{i+1}@example.com",
            password="123456",
            phone=f"0121000{i:04d}",
            parent_phone=f"0151000{i:04d}",
            educational_level=level,
            role=User.Roles.STUDENT,
            status=User.Status.ACTIVE,
            enrolled_at=date.today(),
        )

        students.append(student)

    print("Creating subjects...")

    subjects = []

    subject_names = [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "English",
        "Arabic",
        "History",
        "Geography",
    ]

    for name in subject_names:
        subject = Subject.objects.create(
            academy=academy,
            name=name,
            description=f"{name} Subject",
        )

        subjects.append(subject)

    print("Creating classes...")

    classes = []

    for subject in subjects:

        for section in ["A", "B", "C"]:

            cls = Class.objects.create(
                academy=academy,
                subject=subject,
                name=f"{subject.name} {section}",
                start_date=date.today(),
                end_date=date.today() + timedelta(days=120),
                session_count=20,
                session_price=Decimal("100"),
                session_duration=timedelta(hours=2),
            )

            classes.append(cls)

            ClassSchedule.objects.create(
                class_obj=cls,
                day_of_week=random.randint(0, 6),
                start_time=time(16, 0),
            )

    print("Assigning teachers...")

    for cls in classes:

        teacher = random.choice(teacher_profiles)

        TeacherClass.objects.create(
            assigned_class=cls,
            teacher=teacher,
            assigned_at=cls.start_date,
        )

    print("Creating enrollments...")

    enrollments = []

    for student in students:

        selected_classes = random.sample(
            classes,
            random.randint(2, 4)
        )

        for cls in selected_classes:

            enrollment = Enrollment.objects.create(
                class_id=cls,
                student_id=student,
                start_date=cls.start_date,
                status="active",
            )

            enrollments.append(enrollment)

            Payment.objects.create(
                enrollment_id=enrollment,
                amount=cls.class_price,
                due_date=date.today() + timedelta(days=3),
                status="completed",
                paid_on=date.today(),
            )

    print("Creating sessions...")

    session_links = []

    for cls in classes:

        for num in range(1, 6):

            session = ClassSession.objects.create(
                session_date=cls.start_date + timedelta(days=num * 7),
                session_time=time(16, 0),
                notes=f"Session {num}",
            )

            link = ClassSessionEnrollment.objects.create(
                class_obj=cls,
                session=session,
                session_num=num,
            )

            session_links.append(link)

    print("Creating attendance...")

    for link in session_links:

        class_enrollments = Enrollment.objects.filter(
            class_id=link.class_obj
        )

        for enrollment in class_enrollments:

            Attendance.objects.create(
                session=link.session,
                enrollment=enrollment,
                present=random.choice([True, True, True, False]),
            )

    print("Creating grades...")

    attendances = Attendance.objects.select_related(
        "session",
        "enrollment",
    )

    for attendance in attendances:

        Grade.objects.create(
            enrollment=attendance.enrollment,
            session=attendance.session,
            subject_name=attendance.enrollment.class_id.subject.name,
            score=random.randint(50, 100),
            max_score=100,
            assigned_at=attendance.session.session_date,
        )

    print("====================================")
    print("SEED COMPLETED SUCCESSFULLY")
    print("====================================")
    print(f"Students: {User.objects.filter(role='S').count()}")
    print(f"Teachers: {Teachers.objects.count()}")
    print(f"Subjects: {Subject.objects.count()}")
    print(f"Classes: {Class.objects.count()}")
    print(f"Enrollments: {Enrollment.objects.count()}")
    print(f"Payments: {Payment.objects.count()}")
    print(f"Sessions: {ClassSession.objects.count()}")
    print(f"Attendance: {Attendance.objects.count()}")
    print(f"Grades: {Grade.objects.count()}")
class Command(BaseCommand):
    help = "Seed database with sample data"

    def handle(self, *args, **options):
        run()
    