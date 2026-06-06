import os
from datetime import date, time
from core.models import Academy, User
from students.models import Students
from structure.models import Subject, Class, TeacherClass
from financial_operations.models import Teachers, Enrollment
from records.models import SubjectSession

# Wipe
SubjectSession.objects.all().delete()
Enrollment.objects.all().delete()
TeacherClass.objects.all().delete()
Class.objects.all().delete()
Subject.objects.all().delete()
Teachers.objects.all().delete()
Students.objects.all().delete()
User.objects.all().delete()
Academy.objects.all().delete()

# Academy
academy = Academy.objects.create(name="Nile Academy", email="info@nileacademy.com", phone="01012345678")

# Users
owner = User.objects.create_user(email="owner@nileacademy.com", password="pass1234", full_name="Sara Khalil", phone="01011111111", role=User.Roles.OWNER, academy=academy)
teacher_user1 = User.objects.create_user(email="teacher1@nileacademy.com", password="pass1234", full_name="Ahmed Mostafa", phone="01022222222", role=User.Roles.TEACHER, academy=academy)
teacher_user2 = User.objects.create_user(email="teacher2@nileacademy.com", password="pass1234", full_name="Mona Adel", phone="01033333333", role=User.Roles.TEACHER, academy=academy)
student_user1 = User.objects.create_user(email="student1@gmail.com", password="pass1234", full_name="Youssef Ibrahim", phone="01044444444", role=User.Roles.STUDENT, academy=academy)
student_user2 = User.objects.create_user(email="student2@gmail.com", password="pass1234", full_name="Nadia Hassan", phone="01055555555", role=User.Roles.STUDENT, academy=academy)
student_user3 = User.objects.create_user(email="student3@gmail.com", password="pass1234", full_name="Omar Tarek", phone="01066666666", role=User.Roles.STUDENT, academy=academy)

# Students
student1 = Students.objects.create(academy=academy, user=student_user1, patent_phone="01077777777", educational_level=10, status=Students.Status.ACTIVE)
student2 = Students.objects.create(academy=academy, user=student_user2, patent_phone="01088888888", educational_level=11, status=Students.Status.ACTIVE)
student3 = Students.objects.create(academy=academy, user=student_user3, patent_phone="01099999999", educational_level=9,  status=Students.Status.PENDING)

# Subjects
math      = Subject.objects.create(academy=academy, name="Mathematics", description="Algebra and calculus.", session_count=20, is_active=True)
physics   = Subject.objects.create(academy=academy, name="Physics",     description="Mechanics and waves.", session_count=15, is_active=True)
chemistry = Subject.objects.create(academy=academy, name="Chemistry",   description="Organic chemistry.",   session_count=12, is_active=False)

# Teachers
teacher1 = Teachers.objects.create(academy_id=academy, user_id=teacher_user1, rate_per_session="150.00", session_duration=time(1, 30))
teacher2 = Teachers.objects.create(academy_id=academy, user_id=teacher_user2, rate_per_session="120.00", session_duration=time(1, 0))

# Classes
math_class_a   = Class.objects.create(academy=academy, subject=math,      name="Math - Group A",      session_time=time(9,  0), start_date=date(2025, 1, 1), end_date=date(2025, 6, 30), is_active=True)
math_class_b   = Class.objects.create(academy=academy, subject=math,      name="Math - Group B",      session_time=time(11, 0), start_date=date(2025, 1, 1), end_date=date(2025, 6, 30), is_active=True)
physics_class  = Class.objects.create(academy=academy, subject=physics,   name="Physics - Group A",   session_time=time(14, 0), start_date=date(2025, 2, 1), end_date=date(2025, 7, 31), is_active=True)
inactive_class = Class.objects.create(academy=academy, subject=chemistry, name="Chemistry - Group A", session_time=time(16, 0), start_date=date(2024, 9, 1), end_date=date(2024, 12, 31), is_active=False)

# TeacherClass
TeacherClass.objects.create(assigned_class=math_class_a,  teacher=teacher1, assigned_at=date(2025, 1, 1))
TeacherClass.objects.create(assigned_class=math_class_a,  teacher=teacher2, assigned_at=date(2025, 1, 1))
TeacherClass.objects.create(assigned_class=math_class_b,  teacher=teacher2, assigned_at=date(2025, 1, 1))
TeacherClass.objects.create(assigned_class=physics_class, teacher=teacher1, assigned_at=date(2025, 2, 1))

# Enrollments
Enrollment.objects.create(class_id=math_class_a,  student_id=student1, fee_amount="500.00", payment_cycle=date(2025, 1, 1), start_date=date(2025, 1, 1), status="active")
Enrollment.objects.create(class_id=math_class_a,  student_id=student2, fee_amount="500.00", payment_cycle=date(2025, 1, 1), start_date=date(2025, 1, 1), status="active")
Enrollment.objects.create(class_id=math_class_a,  student_id=student3, fee_amount="450.00", payment_cycle=date(2025, 1, 1), start_date=date(2025, 1, 1), status="paused")
Enrollment.objects.create(class_id=physics_class, student_id=student1, fee_amount="600.00", payment_cycle=date(2025, 2, 1), start_date=date(2025, 2, 1), status="active")

# Sessions
for i in range(1, 8):
    SubjectSession.objects.create(class_obj=math_class_a, session_num=i, session_date=date(2025, 1, i), notes=f"Session {i} notes")
for i in range(1, 4):
    SubjectSession.objects.create(class_obj=physics_class, session_num=i, session_date=date(2025, 2, i))

print("✅ Done!")
print(f"math_class_a   (2 active + 1 paused student, 7/20 sessions): {math_class_a.id}")
print(f"math_class_b   (0 students, 0 sessions)                    : {math_class_b.id}")
print(f"physics_class  (1 active student, 3/15 sessions)           : {physics_class.id}")
print(f"inactive_class (is_active=False)                           : {inactive_class.id}")
print(f"math subject                                               : {math.id}")
print(f"physics subject                                            : {physics.id}")
print(f"teacher1                                                   : {teacher1.id}")
print(f"teacher2                                                   : {teacher2.id}")