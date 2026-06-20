"""
Sample data script for Django shell.
Run with: docker compose exec web python manage.py shell < sample.py
"""

import uuid
from datetime import date, timedelta, time
from django.utils import timezone

from core.models import Academy, User, Students
from structure.models import Subject, Class, ClassSchedule, ClassSessionEnrollment
from financial_operations.models import Teachers, Enrollment, Payment
from records.models import ClassSession, Attendance
from grades.models import Grade
from ai.agent.models import Alert, ScanLog
from ai.notifications.models import Notification
from ai.reports.models import AIReportCard

print("🧹 Clearing existing data...")
AIReportCard.objects.all().delete()
Notification.objects.all().delete()
Alert.objects.all().delete()
ScanLog.objects.all().delete()
Grade.objects.all().delete()
Attendance.objects.all().delete()
ClassSessionEnrollment.objects.all().delete()
Enrollment.objects.all().delete()
Payment.objects.all().delete()
ClassSchedule.objects.all().delete()
ClassSession.objects.all().delete()
Class.objects.all().delete()
Subject.objects.all().delete()
Teachers.objects.all().delete()
Students.objects.all().delete()
User.objects.filter(is_superuser=False).delete()
Academy.objects.all().delete()

print("🏫 Creating Academy...")
academy = Academy.objects.create(
    name="Bright Minds Academy",
    email="admin@brightminds.com",
    phone="01012345678",
    address="123 Nile Street, Cairo, Egypt",
    subscription_end=date.today() + timedelta(days=365),
    setup_complete=True,
    weekly_report_enabled=True,
)

# ── Users ──────────────────────────────────────────────────────────────────────
print("👤 Creating Users...")

owner_user = User.objects.create_user(
    email="owner@example.com",
    password="123456",
    full_name="Sara Hassan",
    phone="01000000001",
    role=User.Roles.OWNER,
    academy=academy,
)

teacher_user1 = User.objects.create_user(
    email="teacher1@brightminds.com",
    password="password123",
    full_name="Ahmed Mostafa",
    phone="01000000002",
    role=User.Roles.TEACHER,
    academy=academy,
)

teacher_user2 = User.objects.create_user(
    email="teacher2@brightminds.com",
    password="password123",
    full_name="Nadia Kamal",
    phone="01000000003",
    role=User.Roles.TEACHER,
    academy=academy,
)

student_users_data = [
    ("Youssef Ali",       "youssef@example.com",  "01011111111"),
    ("Mariam Samir",      "mariam@example.com",   "01011111112"),
    ("Omar Fathy",        "omar@example.com",     "01011111113"),
    ("Layla Ibrahim",     "layla@example.com",    "01011111114"),
    ("Karim Nour",        "karim@example.com",    "01011111115"),
]

student_users = []
for full_name, email, phone in student_users_data:
    u = User.objects.create_user(
        email=email,
        password="password123",
        full_name=full_name,
        phone=phone,
        role=User.Roles.STUDENT,
        academy=academy,
    )
    student_users.append(u)

# ── Teachers ───────────────────────────────────────────────────────────────────
print("🎓 Creating Teachers...")
teacher1 = Teachers.objects.create(academy_id=academy, user_id=teacher_user1)
teacher2 = Teachers.objects.create(academy_id=academy, user_id=teacher_user2)

# ── Students ───────────────────────────────────────────────────────────────────
print("🧑‍🎒 Creating Students...")
levels = [
    Students.EducationalLevel.SEC_1,
    Students.EducationalLevel.SEC_2,
    Students.EducationalLevel.SEC_1,
    Students.EducationalLevel.PREP_3,
    Students.EducationalLevel.SEC_2,
]
parent_emails = [
    "parent1@example.com",
    "parent2@example.com",
    "parent3@example.com",
    "parent4@example.com",
    "parent5@example.com",
]
students = []
for i, u in enumerate(student_users):
    s = Students.objects.create(
        user=u,
        academy=academy,
        parent_email=parent_emails[i],
        educational_level=levels[i],
        status=Students.Status.ACTIVE,
        enrolled_at=date.today() - timedelta(days=90),
    )
    students.append(s)

# ── Subjects ───────────────────────────────────────────────────────────────────
print("📚 Creating Subjects...")
math    = Subject.objects.create(academy=academy, name="Mathematics",   description="Algebra, Geometry & Calculus")
physics = Subject.objects.create(academy=academy, name="Physics",       description="Mechanics, Waves & Electromagnetism")
english = Subject.objects.create(academy=academy, name="English",       description="Grammar, Reading & Writing")

# ── Classes ────────────────────────────────────────────────────────────────────
print("🏛️ Creating Classes...")
today = date.today()

math_class = Class.objects.create(
    academy=academy,
    subject=math,
    name="Math Sec-1 Group A",
    start_date=today - timedelta(days=60),
    end_date=today + timedelta(days=120),
    is_active=True,
    session_count=36,
    session_price=150.00,
    session_duration=timedelta(hours=1, minutes=30),
)

physics_class = Class.objects.create(
    academy=academy,
    subject=physics,
    name="Physics Sec-2 Group B",
    start_date=today - timedelta(days=45),
    end_date=today + timedelta(days=135),
    is_active=True,
    session_count=30,
    session_price=175.00,
    session_duration=timedelta(hours=2),
)

english_class = Class.objects.create(
    academy=academy,
    subject=english,
    name="English Prep-3 Group C",
    start_date=today - timedelta(days=30),
    end_date=today + timedelta(days=150),
    is_active=True,
    session_count=24,
    session_price=120.00,
    session_duration=timedelta(hours=1),
)

# Assign teachers to classes
from structure.models import TeacherClass
TeacherClass.objects.create(assigned_class=math_class,    teacher=teacher1, assigned_at=math_class.start_date)
TeacherClass.objects.create(assigned_class=physics_class, teacher=teacher2, assigned_at=physics_class.start_date)
TeacherClass.objects.create(assigned_class=english_class, teacher=teacher1, assigned_at=english_class.start_date)

# ── Class Schedules ────────────────────────────────────────────────────────────
print("📅 Creating Class Schedules...")
ClassSchedule.objects.create(class_obj=math_class,    day_of_week=0, start_time=time(10, 0))  # Monday
ClassSchedule.objects.create(class_obj=math_class,    day_of_week=3, start_time=time(10, 0))  # Thursday
ClassSchedule.objects.create(class_obj=physics_class, day_of_week=1, start_time=time(14, 0))  # Tuesday
ClassSchedule.objects.create(class_obj=physics_class, day_of_week=4, start_time=time(14, 0))  # Friday
ClassSchedule.objects.create(class_obj=english_class, day_of_week=2, start_time=time(16, 0))  # Wednesday

# ── Enrollments ────────────────────────────────────────────────────────────────
print("📝 Creating Enrollments...")
# students[0,1,2] → math; students[1,2,3] → physics; students[3,4] → english
enrollments = {}

for s in students[:3]:
    e = Enrollment.objects.create(
        class_id=math_class,
        student_id=s,
        start_date=math_class.start_date,
        status="active",
    )
    enrollments[(s.pk, "math")] = e

for s in students[1:4]:
    e = Enrollment.objects.create(
        class_id=physics_class,
        student_id=s,
        start_date=physics_class.start_date,
        status="active",
    )
    enrollments[(s.pk, "physics")] = e

for s in students[3:]:
    e = Enrollment.objects.create(
        class_id=english_class,
        student_id=s,
        start_date=english_class.start_date,
        status="active",
    )
    enrollments[(s.pk, "english")] = e

# ── Payments ───────────────────────────────────────────────────────────────────
print("💳 Creating Payments...")
for key, enrollment in enrollments.items():
    cls = enrollment.class_id
    total = cls.session_price * cls.session_count
    # 3 monthly instalments
    for i in range(3):
        due = enrollment.start_date + timedelta(days=30 * i)
        paid = i < 2  # first 2 paid, last pending
        Payment.objects.create(
            enrollment_id=enrollment,
            due_date=due,
            paid_on=due if paid else None,
            status="completed" if paid else "pending",
            amount=round(total / 3, 2),
        )

# ── Class Sessions & Attendance ────────────────────────────────────────────────
print("📋 Creating Sessions & Attendance...")
import random

session_map = {"math": math_class, "physics": physics_class, "english": english_class}
all_sessions = {}

for label, cls in session_map.items():
    # generate 8 past sessions
    sessions_for_class = []
    for i in range(8):
        session_date = cls.start_date + timedelta(days=i * 7)
        session_time = time(10, 0) if label == "math" else (time(14, 0) if label == "physics" else time(16, 0))
        session, _ = ClassSession.objects.get_or_create(
            session_date=session_date,
            session_time=session_time,
        )
        # Link session to class
        ClassSessionEnrollment.objects.get_or_create(
            class_obj=cls,
            session=session,
            defaults={"session_num": i + 1},
        )
        sessions_for_class.append(session)
    all_sessions[label] = sessions_for_class

# Record attendance for each enrolled student
for (student_pk, label), enrollment in enrollments.items():
    for session in all_sessions[label]:
        Attendance.objects.create(
            session=session,
            enrollment=enrollment,
            present=random.random() > 0.2,  # 80% attendance rate
        )

# ── Grades ─────────────────────────────────────────────────────────────────────
print("📊 Creating Grades...")
for (student_pk, label), enrollment in enrollments.items():
    subject_name = enrollment.class_id.subject.name
    for i, session in enumerate(all_sessions[label][:5]):
        score = round(random.uniform(55, 100), 2)
        Grade.objects.create(
            enrollment=enrollment,
            session=session,
            subject_name=subject_name,
            score=score,
            max_score=100,
            assigned_at=session.session_date,
        )

# ── Alerts ─────────────────────────────────────────────────────────────────────
print("🚨 Creating Alerts...")
risk_data = [
    ("high",   85, "3 consecutive absences + overdue payment",     "Call parent immediately"),
    ("medium", 55, "Declining grades over last 4 sessions",        "Schedule a check-in meeting"),
    ("low",    25, "One missed session, otherwise on track",       "Send a gentle reminder"),
]
alerts = []
for i, (level, score, reason, action) in enumerate(risk_data):
    enrollment = list(enrollments.values())[i]
    alert = Alert.objects.create(
        enrollment=enrollment,
        risk_level=level,
        risk_score=score,
        primary_reason=reason,
        recommended_action=action,
        message=f"This student has been flagged as {level} risk. {action}.",
    )
    alerts.append(alert)

# ── Notifications ──────────────────────────────────────────────────────────────
print("🔔 Creating Notifications...")
notif_types = ["retention_alert", "payment_reminder", "attendance_alert"]
for i, alert in enumerate(alerts):
    enrollment = alert.enrollment
    Notification.objects.create(
        student=enrollment.student_id,
        enrollment=enrollment,
        alert=alert,
        notification_type=notif_types[i % len(notif_types)],
        channel="email",
        message=alert.message,
        status="sent" if i < 2 else "pending",
        sent_at=timezone.now() if i < 2 else None,
    )

# ── AI Report Cards ────────────────────────────────────────────────────────────
print("🤖 Creating AI Report Cards...")
month_str = today.strftime("%Y-%m")
for i, (student_pk, label) in enumerate(list(enrollments.keys())[:3]):
    enrollment = enrollments[(student_pk, label)]
    student    = Students.objects.get(pk=student_pk)
    AIReportCard.objects.create(
        student=student,
        enrollment=enrollment,
        month=month_str,
        summary_text=f"{student.user.full_name} has shown {'strong' if i == 0 else 'moderate' if i == 1 else 'concerning'} progress this month.",
        risk_level=["low", "medium", "high"][i],
        risk_score=[20, 50, 80][i],
    )

# ── Scan Log ───────────────────────────────────────────────────────────────────
print("🔍 Creating Scan Log...")
ScanLog.objects.create(
    academy=academy,
    status=ScanLog.STATUS_COMPLETE,
    triggered_by="scheduled",
    students_scanned=len(students),
    alerts_created=len(alerts),
    alerts_updated=0,
    errors=0,
    completed_at=timezone.now(),
)

print("\n✅ Done! Sample data created successfully.")
print(f"   Academy  : {academy.name}")
print(f"   Students : {Students.objects.count()}")
print(f"   Classes  : {Class.objects.count()}")
print(f"   Enrollments: {Enrollment.objects.count()}")
print(f"   Sessions : {ClassSession.objects.count()}")
print(f"   Payments : {Payment.objects.count()}")
print(f"   Grades   : {Grade.objects.count()}")
print(f"   Alerts   : {Alert.objects.count()}")
print(f"   Notifs   : {Notification.objects.count()}")
print(f"   Reports  : {AIReportCard.objects.count()}")