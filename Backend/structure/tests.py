from django.test import TestCase

# Create your tests here.
import pytest
from datetime import date, timedelta, time

from django.core.exceptions import ValidationError

from core.models import Academy, User
from structure.models import (
    Subject,
    Class,
    ClassSchedule,
    TeacherClass,
)
from financial_operations.models import Teachers


# ==================================================
# Fixtures
# ==================================================

@pytest.fixture
def academy():
    return Academy.objects.create(
        name="Academy",
        email="academy@test.com",
        phone="010",
        address="Tanta",
        subscription_end=date.today() + timedelta(days=30),
    )


@pytest.fixture
def subject(academy):
    return Subject.objects.create(
        academy=academy,
        name="Math",
        description="Math Subject",
    )


@pytest.fixture
def teacher_user(academy):
    return User.objects.create_user(
        academy=academy,
        full_name="Teacher",
        email="teacher@test.com",
        password="123456",
        phone="010",
        parent_phone="",
        educational_level=18,
        role=User.Roles.TEACHER,
    )


@pytest.fixture
def teacher_profile(academy, teacher_user):
    return Teachers.objects.create(
        academy_id=academy,
        user_id=teacher_user,
    )


@pytest.fixture
def class_obj(academy, subject):
    return Class.objects.create(
        academy=academy,
        subject=subject,
        name="Math A",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=90),
        session_count=20,
        session_price=100,
        session_duration=timedelta(hours=2),
    )


# ==================================================
# Subject Tests
# ==================================================

@pytest.mark.django_db
def test_create_subject(subject):
    assert subject.name == "Math"


@pytest.mark.django_db
def test_subject_str(subject):
    assert str(subject) == "Math"


@pytest.mark.django_db
def test_subject_unique_per_academy(academy):

    Subject.objects.create(
        academy=academy,
        name="Physics",
        description="desc",
    )

    with pytest.raises(Exception):
        Subject.objects.create(
            academy=academy,
            name="Physics",
            description="duplicate",
        )


# ==================================================
# Class Tests
# ==================================================

@pytest.mark.django_db
def test_class_creation(class_obj):
    assert class_obj.name == "Math A"


@pytest.mark.django_db
def test_class_str(class_obj):
    assert str(class_obj) == "Math A"


@pytest.mark.django_db
def test_class_price_property(class_obj):
    assert class_obj.class_price == 2000


@pytest.mark.django_db
def test_class_price_none(subject, academy):

    cls = Class.objects.create(
        academy=academy,
        subject=subject,
        name="No Price",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=10),
    )

    assert cls.class_price is None


@pytest.mark.django_db
def test_class_end_date_validation(subject, academy):

    cls = Class(
        academy=academy,
        subject=subject,
        name="Invalid",
        start_date=date.today(),
        end_date=date.today(),
    )

    with pytest.raises(ValidationError):
        cls.full_clean()


@pytest.mark.django_db
def test_class_end_date_before_start(subject, academy):

    cls = Class(
        academy=academy,
        subject=subject,
        name="Invalid",
        start_date=date.today(),
        end_date=date.today() - timedelta(days=1),
    )

    with pytest.raises(ValidationError):
        cls.full_clean()


# ==================================================
# Schedule Tests
# ==================================================

@pytest.mark.django_db
def test_schedule_creation(class_obj):

    schedule = ClassSchedule.objects.create(
        class_obj=class_obj,
        day_of_week=1,
        start_time=time(16, 0),
    )

    assert schedule.end_time == time(18, 0)


@pytest.mark.django_db
def test_schedule_str(class_obj):

    schedule = ClassSchedule.objects.create(
        class_obj=class_obj,
        day_of_week=1,
        start_time=time(16, 0),
    )

    assert class_obj.name in str(schedule)


@pytest.mark.django_db
def test_schedule_requires_duration(subject, academy):

    cls = Class.objects.create(
        academy=academy,
        subject=subject,
        name="No Duration",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=10),
    )

    schedule = ClassSchedule(
        class_obj=cls,
        day_of_week=0,
        start_time=time(16, 0),
    )

    with pytest.raises(ValidationError):
        schedule.full_clean()


@pytest.mark.django_db
def test_schedule_unique_slot(class_obj):

    ClassSchedule.objects.create(
        class_obj=class_obj,
        day_of_week=1,
        start_time=time(16, 0),
    )

    with pytest.raises(Exception):
        ClassSchedule.objects.create(
            class_obj=class_obj,
            day_of_week=1,
            start_time=time(16, 0),
        )


# ==================================================
# Teacher Assignment
# ==================================================

@pytest.mark.django_db
def test_teacher_assignment_create(
    class_obj,
    teacher_profile,
):

    assignment = TeacherClass.objects.create(
        assigned_class=class_obj,
        teacher=teacher_profile,
        assigned_at=class_obj.start_date,
    )

    assert assignment.teacher == teacher_profile


@pytest.mark.django_db
def test_teacher_assignment_str(
    class_obj,
    teacher_profile,
):

    assignment = TeacherClass.objects.create(
        assigned_class=class_obj,
        teacher=teacher_profile,
        assigned_at=class_obj.start_date,
    )

    assert class_obj.name in str(assignment)


@pytest.mark.django_db
def test_teacher_assignment_unique(
    class_obj,
    teacher_profile,
):

    TeacherClass.objects.create(
        assigned_class=class_obj,
        teacher=teacher_profile,
        assigned_at=class_obj.start_date,
    )

    with pytest.raises(Exception):
        TeacherClass.objects.create(
            assigned_class=class_obj,
            teacher=teacher_profile,
            assigned_at=class_obj.start_date,
        )


@pytest.mark.django_db
def test_teacher_assignment_before_start_date(
    class_obj,
    teacher_profile,
):

    assignment = TeacherClass(
        assigned_class=class_obj,
        teacher=teacher_profile,
        assigned_at=class_obj.start_date - timedelta(days=1),
    )

    with pytest.raises(ValidationError):
        assignment.full_clean()


@pytest.mark.django_db
def test_teacher_assignment_after_end_date(
    class_obj,
    teacher_profile,
):

    assignment = TeacherClass(
        assigned_class=class_obj,
        teacher=teacher_profile,
        assigned_at=class_obj.end_date + timedelta(days=1),
    )

    with pytest.raises(ValidationError):
        assignment.full_clean()


# ==================================================
# Relationship Tests
# ==================================================

@pytest.mark.django_db
def test_class_subject_relation(class_obj, subject):

    assert class_obj.subject == subject


@pytest.mark.django_db
def test_subject_classes_relation(subject, class_obj):

    assert subject.classes.count() == 1


@pytest.mark.django_db
def test_teacher_class_relation(
    class_obj,
    teacher_profile,
):

    TeacherClass.objects.create(
        assigned_class=class_obj,
        teacher=teacher_profile,
        assigned_at=class_obj.start_date,
    )

    assert class_obj.teacher_assignments.count() == 1


@pytest.mark.django_db
def test_class_active_default(class_obj):
    assert class_obj.is_active is True


@pytest.mark.django_db
def test_session_count_saved(class_obj):
    assert class_obj.session_count == 20


@pytest.mark.django_db
def test_session_price_saved(class_obj):
    assert class_obj.session_price == 100