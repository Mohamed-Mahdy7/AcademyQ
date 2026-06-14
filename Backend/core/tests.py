from django.test import TestCase

import pytest
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from core.models import Academy
from core.permissions import (
    IsOwner,
    ActiveSubscriptionRequired,
)
from core.serializers import (
    AcademyRegistrationSerializer,
    StudentCreateSerializer,
    StaffCreateSerializer,
)

User = get_user_model()


# =====================================================
# Fixtures
# =====================================================

@pytest.fixture
def academy():
    return Academy.objects.create(
        name="Test Academy",
        email="academy@test.com",
        phone="01000000000",
        address="Tanta",
        subscription_end=date.today() + timedelta(days=30),
        setup_complete=False,
    )


@pytest.fixture
def owner(academy):
    return User.objects.create_user(
        academy=academy,
        full_name="Owner",
        email="owner@test.com",
        password="123456",
        phone="01011111111",
        parent_phone="",
        educational_level=18,
        role=User.Roles.OWNER,
        status=User.Status.ACTIVE,
    )


@pytest.fixture
def admin_user(academy):
    return User.objects.create_user(
        academy=academy,
        full_name="Admin",
        email="admin@test.com",
        password="123456",
        phone="01022222222",
        parent_phone="",
        educational_level=18,
        role=User.Roles.ADMIN,
        status=User.Status.ACTIVE,
    )


@pytest.fixture
def student(academy):
    return User.objects.create_user(
        academy=academy,
        full_name="Student",
        email="student@test.com",
        password="123456",
        phone="01033333333",
        parent_phone="01099999999",
        educational_level=10,
        role=User.Roles.STUDENT,
        status=User.Status.ACTIVE,
    )


# =====================================================
# Academy Tests
# =====================================================

@pytest.mark.django_db
def test_academy_has_active_subscription_true(academy):
    assert academy.has_active_subscription() is True


@pytest.mark.django_db
def test_academy_has_active_subscription_false():
    academy = Academy.objects.create(
        name="Expired",
        email="expired@test.com",
        phone="010",
        address="x",
        subscription_end=date.today() - timedelta(days=1),
    )

    assert academy.has_active_subscription() is False


@pytest.mark.django_db
def test_academy_str(academy):
    assert str(academy) == academy.name


# =====================================================
# User Tests
# =====================================================

@pytest.mark.django_db
def test_create_user_success(academy):
    user = User.objects.create_user(
        academy=academy,
        full_name="Test",
        email="user@test.com",
        password="123456",
        phone="010",
        parent_phone="010",
        educational_level=10,
        role=User.Roles.STUDENT,
    )

    assert user.email == "user@test.com"
    assert user.check_password("123456")


@pytest.mark.django_db
def test_create_user_without_email():
    with pytest.raises(ValueError):
        User.objects.create_user(
            email="",
            password="123456",
        )


@pytest.mark.django_db
def test_create_superuser():
    user = User.objects.create_superuser(
        email="super@test.com",
        password="123456",
        full_name="Super",
        phone="010",
        parent_phone="",
        educational_level=18,
        role=User.Roles.OWNER,
    )

    assert user.is_staff is True
    assert user.is_superuser is True


@pytest.mark.django_db
def test_user_str(student):
    assert str(student) == student.full_name


# =====================================================
# Registration Serializer
# =====================================================

@pytest.mark.django_db
def test_registration_serializer_valid():

    serializer = AcademyRegistrationSerializer(
        data={
            "academy_name": "Academy",
            "academy_email": "academy@test.com",
            "academy_phone": "010",
            "address": "Tanta",
            "full_name": "Owner",
            "email": "owner@test.com",
            "phone": "010111",
            "password": "123456",
            "confirm_password": "123456",
        }
    )

    assert serializer.is_valid()


@pytest.mark.django_db
def test_registration_serializer_password_mismatch():

    serializer = AcademyRegistrationSerializer(
        data={
            "academy_name": "Academy",
            "academy_email": "academy@test.com",
            "academy_phone": "010",
            "address": "Tanta",
            "full_name": "Owner",
            "email": "owner@test.com",
            "phone": "010111",
            "password": "123456",
            "confirm_password": "654321",
        }
    )

    assert serializer.is_valid() is False
    assert "confirm_password" in serializer.errors


@pytest.mark.django_db
def test_registration_serializer_create():

    serializer = AcademyRegistrationSerializer(
        data={
            "academy_name": "Academy",
            "academy_email": "academy@test.com",
            "academy_phone": "010",
            "address": "Tanta",
            "full_name": "Owner",
            "email": "owner@test.com",
            "phone": "010111",
            "password": "123456",
            "confirm_password": "123456",
        }
    )

    serializer.is_valid(raise_exception=True)

    user = serializer.save()

    assert user.role == User.Roles.OWNER
    assert user.academy is not None


# =====================================================
# Student Serializer
# =====================================================

@pytest.mark.django_db
def test_student_serializer_password_match(academy):

    serializer = StudentCreateSerializer(
        data={
            "full_name": "Student",
            "email": "student1@test.com",
            "phone": "010",
            "parent_phone": "010",
            "educational_level": 10,
            "academy": academy.id,
            "password": "123456",
            "confirm_password": "123456",
        }
    )

    assert serializer.is_valid()


@pytest.mark.django_db
def test_student_serializer_password_mismatch(academy):

    serializer = StudentCreateSerializer(
        data={
            "full_name": "Student",
            "email": "student1@test.com",
            "phone": "010",
            "parent_phone": "010",
            "educational_level": 10,
            "academy": academy.id,
            "password": "123456",
            "confirm_password": "999999",
        }
    )

    assert serializer.is_valid() is False


# =====================================================
# Staff Serializer
# =====================================================

@pytest.mark.django_db
def test_staff_serializer_password_validation():

    serializer = StaffCreateSerializer(
        data={
            "full_name": "Admin",
            "email": "admin@test.com",
            "phone": "010",
            "password": "123456",
            "confirm_password": "123456",
            "role": User.Roles.ADMIN,
        }
    )

    assert serializer.is_valid()


@pytest.mark.django_db
def test_staff_serializer_password_mismatch():

    serializer = StaffCreateSerializer(
        data={
            "full_name": "Admin",
            "email": "admin@test.com",
            "phone": "010",
            "password": "123456",
            "confirm_password": "000000",
            "role": User.Roles.ADMIN,
        }
    )

    assert serializer.is_valid() is False


# =====================================================
# Permissions
# =====================================================

@pytest.mark.django_db
def test_owner_permission_true(owner):

    factory = APIRequestFactory()
    request = factory.get("/")

    request.user = owner

    permission = IsOwner()

    assert permission.has_permission(request, None) is True


@pytest.mark.django_db
def test_owner_permission_false(admin_user):

    factory = APIRequestFactory()
    request = factory.get("/")

    request.user = admin_user

    permission = IsOwner()

    assert permission.has_permission(request, None) is False


@pytest.mark.django_db
def test_active_subscription_permission_true(owner):

    factory = APIRequestFactory()
    request = factory.get("/")

    request.user = owner

    permission = ActiveSubscriptionRequired()

    assert permission.has_permission(request, None) is True


@pytest.mark.django_db
def test_active_subscription_permission_false():

    academy = Academy.objects.create(
        name="Expired",
        email="expired@test.com",
        phone="010",
        address="x",
        subscription_end=date.today() - timedelta(days=2),
    )

    user = User.objects.create_user(
        academy=academy,
        full_name="Owner",
        email="owner2@test.com",
        password="123456",
        phone="010",
        parent_phone="",
        educational_level=18,
        role=User.Roles.OWNER,
    )

    factory = APIRequestFactory()

    request = factory.get("/")
    request.user = user

    permission = ActiveSubscriptionRequired()

    assert permission.has_permission(request, None) is False


# =====================================================
# Choices Tests
# =====================================================

@pytest.mark.django_db
def test_roles_exist():

    assert User.Roles.OWNER == "O"
    assert User.Roles.ADMIN == "A"
    assert User.Roles.TEACHER == "T"
    assert User.Roles.STUDENT == "S"


@pytest.mark.django_db
def test_status_exist():

    assert User.Status.ACTIVE == "A"
    assert User.Status.PENDING == "P"
    assert User.Status.DROPPED == "D"


@pytest.mark.django_db
def test_educational_level_choices():

    assert User.EducationalLevel.PRIMARY_1 == 1
    assert User.EducationalLevel.SEC_3 == 12
    assert User.EducationalLevel.COLLEGE_6 == 18