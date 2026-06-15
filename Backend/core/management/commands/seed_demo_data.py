from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, timedelta, time
import random
from faker import Faker

from core.models import Academy
from structure.models import Class, ClassSchedule, ClassSessionEnrollment, TeacherClass, Subject
from financial_operations.models import Teachers, Enrollment, Payment
from records.models import Attendance, ClassSession
from grades.models import Grade

User = get_user_model()
fake = Faker()


class Command(BaseCommand):
    help = "Seed demo data for AcademiQ"

    def handle(self, *args, **kwargs):
        with transaction.atomic():

            # =========================
            # 0. ACADEMY
            # =========================
            academy = Academy.objects.get(
                id="e9aea078-a6c4-446c-9478-d797a81f7df7"
            )

            self.stdout.write("Academy loaded")

            # =========================
            # 1. TEACHERS
            # =========================
            teacher_data = [
                ("Ahmed Hassan", "teacher1@gmail.com"),
                ("Sara Mostafa", "teacher2@gmail.com"),
                ("Omar Khaled", "teacher3@gmail.com"),
            ]

            teachers = []

            for i, (name, email) in enumerate(teacher_data):
                user = User.objects.create_user(
                    email=email,
                    password="Teacher123!",
                    full_name=name,
                    academy=academy,
                    role="T",
                    status="A",
                    phone=f"01000000{i}",
                    parent_phone="000",
                    is_active=True,
                )

                teacher = Teachers.objects.create(
                    academy_id=academy,
                    user_id=user
                )

                teachers.append(teacher)

            self.stdout.write("Teachers created")

            # =========================
            # 2. SUBJECTS
            # =========================
            subjects = []

            for name in ["Mathematics", "Physics", "English"]:
                subjects.append(
                    Subject.objects.create(
                        academy=academy,
                        name=name,
                        description=fake.text()
                    )
                )

            # =========================
            # 3. CLASSES
            # =========================
            classes = []

            class_defs = [
                ("Math A", subjects[0], 150, teachers[0]),
                ("Math B", subjects[0], 150, teachers[0]),
                ("Physics A", subjects[1], 175, teachers[1]),
                ("Physics B", subjects[1], 175, teachers[1]),
                ("English A", subjects[2], 125, teachers[2]),
            ]

            for name, subject, price, teacher in class_defs:
                cls = Class.objects.create(
                    academy=academy,
                    subject=subject,
                    name=name,
                    start_date=date.today() - timedelta(days=60),
                    end_date=date.today() + timedelta(days=60),
                    session_count=10,
                    session_price=Decimal(price),
                    session_duration=timedelta(hours=1, minutes=30)
                )

                TeacherClass.objects.create(
                    assigned_class=cls,
                    teacher=teacher,
                    assigned_at=date.today()
                )

                classes.append(cls)

            self.stdout.write("Classes created")

            # =========================
            # 4. SCHEDULES
            # =========================
            days = [0, 1, 2, 3, 4]

            for i, cls in enumerate(classes):
                ClassSchedule.objects.create(
                    class_obj=cls,
                    day_of_week=days[i],
                    start_time=time(10 + i, 0)
                )

            # =========================
            # 5. SESSIONS (50 total)
            # =========================
            sessions = []
            start_date = date.today() - timedelta(days=60)

            global_index = 0

            for cls_index, cls in enumerate(classes):
                for session_index in range(10):

                    session_date = start_date + timedelta(days=session_index * 7)

                    # GUARANTEED UNIQUE TIME
                    hour = 8 + (global_index % 12)

                    session = ClassSession.objects.create(
                        session_date=session_date,
                        session_time=time(hour, 0),
                        notes=""
                    )

                    ClassSessionEnrollment.objects.create(
                        class_obj=cls,
                        session=session,
                        session_num=session_index + 1
                    )

                    global_index += 1

                    sessions.append((cls, session))

            self.stdout.write("Sessions created")

            # =========================
            # 6. STUDENTS
            # =========================
            students = []

            for i in range(1, 21):

                level = random.choice([7,8,9,10,11,12])

                status = "A" if i <= 16 else "D"

                student = User.objects.create_user(
                    email=f"student{i:02}@gmail.com",
                    password="Student123!",
                    full_name=f"Student {i:02}",
                    academy=academy,
                    role="S",
                    status=status,
                    educational_level=level,
                    phone=f"0110000{i:04}",
                    parent_phone=f"0120000{i:04}",
                    enrolled_at=timezone.now()
                )

                students.append(student)

            self.stdout.write("Students created")

            # =========================
            # 7. ENROLLMENTS
            # =========================
            enrollments = []

            for student in students:
                if student.status == "D":
                    continue

                selected_classes = random.sample(classes, k=random.randint(2, 4))

                for cls in selected_classes:
                    enrollment = Enrollment.objects.create(
                        student_id=student,
                        class_id=cls,
                        start_date=date.today(),
                        status="active"
                    )
                    enrollments.append(enrollment)

                    # PAYMENT
                    Payment.objects.create(
                        enrollment_id=enrollment,
                        amount=cls.session_price * cls.session_count,
                        status=random.choice(["completed", "pending", "cancelled"]),
                        due_date=date.today() + timedelta(days=30),
                        paid_on=date.today() if random.random() > 0.3 else None
                    )

            self.stdout.write("Enrollments + Payments created")

            # =========================
            # 8. ATTENDANCE + GRADES
            # =========================

            for cls, session in sessions:

                related_enrollments = Enrollment.objects.filter(class_id=cls)

                for enrollment in related_enrollments:

                    # Attendance
                    present = random.random() > 0.2

                    Attendance.objects.create(
                        session=session,
                        enrollment=enrollment,
                        present=present
                    )

                    # Grade
                    score = random.randint(40, 100) if present else random.randint(0, 60)

                    Grade.objects.create(
                        enrollment=enrollment,
                        session=session,
                        subject_name=cls.subject.name,
                        score=score,
                        max_score=100,
                        assigned_at=date.today()
                    )

            self.stdout.write(self.style.SUCCESS("Demo data seeded successfully"))