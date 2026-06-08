from datetime import date, timedelta, time
from decimal import Decimal

from core.models import Academy, User
from financial_operations.models import Teachers, Enrollment, Payment
from structure.models import Subject, Class, TeacherClass
from records.models import SubjectSession, Attendance
from grades.models import Grade

# =====================
# Academy
# =====================

academy = Academy.objects.create(
    name="Future Academy",
    email="academy@example.com",
    phone="01000000000",
    address="Tanta, Egypt",
    subscription_end=date.today() + timedelta(days=365),
    setup_complete=True,
)

# =====================
# Users
# =====================

owner = User.objects.create_user(
    email="owner@example.com",
    password="123456",
    academy=academy,
    full_name="Academy Owner",
    phone="01011111111",
    parent_phone="",
    educational_level=18,
    role=User.Roles.OWNER,
)

teacher_user = User.objects.create_user(
    email="teacher@example.com",
    password="123456",
    academy=academy,
    full_name="Ahmed Hassan",
    phone="01022222222",
    parent_phone="",
    educational_level=18,
    role=User.Roles.TEACHER,
)

student1 = User.objects.create_user(
    email="student1@example.com",
    password="123456",
    academy=academy,
    full_name="Mohamed Ali",
    phone="01033333333",
    parent_phone="01099999991",
    educational_level=User.EducationalLevel.SEC_1,
    role=User.Roles.STUDENT,
)

student2 = User.objects.create_user(
    email="student2@example.com",
    password="123456",
    academy=academy,
    full_name="Sara Ahmed",
    phone="01044444444",
    parent_phone="01099999992",
    educational_level=User.EducationalLevel.SEC_1,
    role=User.Roles.STUDENT,
)

# =====================
# Teacher profile
# =====================

teacher = Teachers.objects.create(
    academy_id=academy,
    user_id=teacher_user,
    rate_per_session=Decimal("150.00"),
    session_duration=timedelta(hours=2),
)

# =====================
# Subject
# =====================

math = Subject.objects.create(
    academy=academy,
    name="Mathematics",
    description="Secondary mathematics course",
    session_count=20,
)

# =====================
# Class
# =====================

class_a = Class.objects.create(
    academy=academy,
    subject=math,
    name="Math Sec1 A",
    session_time=time(16, 0),
    start_date=date.today(),
    end_date=date.today() + timedelta(days=90),
)

# =====================
# Teacher Assignment
# =====================

TeacherClass.objects.create(
    assigned_class=class_a,
    teacher=teacher,
    assigned_at=date.today(),
)

# =====================
# Enrollments
# =====================

enrollment1 = Enrollment.objects.create(
    class_id=class_a,
    student_id=student1,
    fee_amount=Decimal("500.00"),
    payment_cycle=timedelta(days=30),
    start_date=date.today(),
)

enrollment2 = Enrollment.objects.create(
    class_id=class_a,
    student_id=student2,
    fee_amount=Decimal("500.00"),
    payment_cycle=timedelta(days=30),
    start_date=date.today(),
)

# =====================
# Sessions
# =====================

session1 = SubjectSession.objects.create(
    class_obj=class_a,
    session_num=1,
    session_date=date.today(),
    notes="Introduction"
)

session2 = SubjectSession.objects.create(
    class_obj=class_a,
    session_num=2,
    session_date=date.today() + timedelta(days=7),
    notes="Algebra"
)

# =====================
# Attendance
# =====================

Attendance.objects.create(
    session=session1,
    enrollment=enrollment1,
    present=True
)

Attendance.objects.create(
    session=session1,
    enrollment=enrollment2,
    present=False
)

# =====================
# Grades
# =====================

Grade.objects.create(
    enrollment=enrollment1,
    session=session1,
    subject_name="Mathematics",
    score=92,
    max_score=100,
    assigned_at=date.today()
)

Grade.objects.create(
    enrollment=enrollment2,
    session=session1,
    subject_name="Mathematics",
    score=78,
    max_score=100,
    assigned_at=date.today()
)

# =====================
# Payments
# =====================

Payment.objects.create(
    enrollment_id=enrollment1,
    amount=Decimal("500.00"),
    paid_on=date.today(),
    notes="First payment"
)

Payment.objects.create(
    enrollment_id=enrollment2,
    amount=Decimal("250.00"),
    paid_on=date.today(),
    notes="Partial payment"
)

print("Sample data created successfully!")