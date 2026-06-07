academy = Academy.objects.create(
    name="Future Minds Academy",
    email="info@futureminds.com",
    phone="+201001112233",
    address="Tanta, Egypt",
    subscription_end="2027-12-31",
    setup_complete=True,
)


owner = User.objects.create_user(
    email="owner@futureminds.com",
    password="test123",
    full_name="Ahmed Hassan",
    phone="+201001112234",
    role="O",
    academy=academy,
    is_staff=True,
)


admin = User.objects.create_user(
    email="admin@futureminds.com",
    password="test123",
    full_name="Sara Mohamed",
    phone="+201001112235",
    role="A",
    academy=academy,
    is_staff=True,
)


teacher_user1 = User.objects.create_user(
    email="teacher.math@futureminds.com",
    password="test123",
    full_name="Mohamed Ali",
    phone="+201001112236",
    role="T",
    academy=academy,
)

teacher_user2 = User.objects.create_user(
    email="teacher.physics@futureminds.com",
    password="test123",
    full_name="Mona Ibrahim",
    phone="+201001112237",
    role="T",
    academy=academy,
)


student_user1 = User.objects.create_user(
    email="student1@gmail.com",
    password="test123",
    full_name="Youssef Mahmoud",
    phone="+201001112238",
    role="S",
    academy=academy,
)

student_user2 = User.objects.create_user(
    email="student2@gmail.com",
    password="test123",
    full_name="Mariam Adel",
    phone="+201001112239",
    role="S",
    academy=academy,
)

student_user3 = User.objects.create_user(
    email="student3@gmail.com",
    password="test123",
    full_name="Omar Khaled",
    phone="+201001112240",
    role="S",
    academy=academy,
)


teacher1 = Teachers.objects.create(
    academy_id=academy,
    user_id=teacher_user1,
    rate_per_session=200,
    session_duration="01:30:00",
)

teacher2 = Teachers.objects.create(
    academy_id=academy,
    user_id=teacher_user2,
    rate_per_session=250,
    session_duration="02:00:00",
)


student1 = Students.objects.create(
    academy=academy,
    user=student_user1,
    patent_phone="+201005551111",
    educational_level=11,
    status="A",
)

student2 = Students.objects.create(
    academy=academy,
    user=student_user2,
    patent_phone="+201005552222",
    educational_level=11,
    status="A",
)

student3 = Students.objects.create(
    academy=academy,
    user=student_user3,
    patent_phone="+201005553333",
    educational_level=12,
    status="A",
)


math = Subject.objects.create(
    academy=academy,
    name="Mathematics",
    description="Advanced Mathematics",
    session_count=24,
)

physics = Subject.objects.create(
    academy=academy,
    name="Physics",
    description="High School Physics",
    session_count=20,
)


math_class = Class.objects.create(
    academy=academy,
    subject=math,
    name="Math Grade 11 - A",
    session_time="17:00",
    start_date="2026-01-15",
    end_date="2026-05-15",
)

physics_class = Class.objects.create(
    academy=academy,
    subject=physics,
    name="Physics Grade 11 - A",
    session_time="19:00",
    start_date="2026-01-15",
    end_date="2026-05-15",
)


TeacherClass.objects.create(
    assigned_class=math_class,
    teacher=teacher1,
    assigned_at="2026-01-01",
)

TeacherClass.objects.create(
    assigned_class=physics_class,
    teacher=teacher2,
    assigned_at="2026-01-01",
)


enrollment1 = Enrollment.objects.create(
    class_id=math_class,
    student_id=student1,
    fee_amount=1200,
    start_date="2026-01-15",
    status="active",
)

enrollment2 = Enrollment.objects.create(
    class_id=math_class,
    student_id=student2,
    fee_amount=1200,
    start_date="2026-01-15",
    status="active",
)

enrollment3 = Enrollment.objects.create(
    class_id=physics_class,
    student_id=student1,
    fee_amount=1400,
    start_date="2026-01-15",
    status="active",
)

enrollment4 = Enrollment.objects.create(
    class_id=physics_class,
    student_id=student3,
    fee_amount=1400,
    start_date="2026-01-15",
    status="active",
)


Payment.objects.create(
    enrollment_id=enrollment1,
    amount=1200,
    paid_on="2026-01-15",
    notes="Full payment",
)

Payment.objects.create(
    enrollment_id=enrollment2,
    amount=600,
    paid_on="2026-01-15",
    notes="First installment",
)

Payment.objects.create(
    enrollment_id=enrollment3,
    amount=1400,
    paid_on="2026-01-15",
)


session1 = SubjectSession.objects.create(
    class_obj=math_class,
    session_num=1,
    session_date="2026-01-15",
    notes="Introduction",
)

session2 = SubjectSession.objects.create(
    class_obj=math_class,
    session_num=2,
    session_date="2026-01-22",
    notes="Algebra",
)

session3 = SubjectSession.objects.create(
    class_obj=physics_class,
    session_num=1,
    session_date="2026-01-16",
    notes="Motion",
)


Attendance.objects.create(
    session=session1,
    enrollment=enrollment1,
    present=True,
)

Attendance.objects.create(
    session=session1,
    enrollment=enrollment2,
    present=False,
)

Attendance.objects.create(
    session=session2,
    enrollment=enrollment1,
    present=True,
)

Attendance.objects.create(
    session=session2,
    enrollment=enrollment2,
    present=True,
)

Attendance.objects.create(
    session=session3,
    enrollment=enrollment3,
    present=True,
)

Attendance.objects.create(
    session=session3,
    enrollment=enrollment4,
    present=True,
)


Grade.objects.create(
    enrollment=enrollment1,
    session=session1,
    subject_name="Quiz 1",
    score=18,
    max_score=20,
    assigned_at="2026-01-15",
)

Grade.objects.create(
    enrollment=enrollment2,
    session=session1,
    subject_name="Quiz 1",
    score=14,
    max_score=20,
    assigned_at="2026-01-15",
)

Grade.objects.create(
    enrollment=enrollment3,
    session=session3,
    subject_name="Physics Quiz",
    score=17,
    max_score=20,
    assigned_at="2026-01-16",
)

Grade.objects.create(
    enrollment=enrollment4,
    session=session3,
    subject_name="Physics Quiz",
    score=19,
    max_score=20,
    assigned_at="2026-01-16",
)
