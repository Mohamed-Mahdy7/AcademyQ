 # core/tests.py

from datetime import timedelta
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient

from core.models import Academy, User
from core.serializers import (
    AcademyRegistrationSerializer,
    StudentCreateSerializer,
)
from core.permissions import (
    ActiveSubscriptionRequired,
    IsOwner,
)


# =========================================================
# MODELS
# =========================================================

class AcademyModelTests(TestCase):

    def test_create_academy(self):
        academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
            phone="01000000000",
        )

        self.assertEqual(
            academy.name,
            "Test Academy"
        )

    def test_active_subscription_true(self):
        academy = Academy.objects.create(
            name="Academy",
            email="a@test.com",
            phone="0100",
            subscription_end=timezone.now().date() + timedelta(days=5)
        )

        self.assertTrue(
            academy.has_active_subscription()
        )

    def test_active_subscription_false(self):
        academy = Academy.objects.create(
            name="Academy",
            email="b@test.com",
            phone="0100",
            subscription_end=timezone.now().date() - timedelta(days=1)
        )

        self.assertFalse(
            academy.has_active_subscription()
        )

    def test_str(self):
        academy = Academy.objects.create(
            name="Future Academy",
            email="c@test.com",
            phone="0100"
        )

        self.assertEqual(
            str(academy),
            "Future Academy"
        )


class UserModelTests(TestCase):

    def setUp(self):
        self.academy = Academy.objects.create(
            name="Academy",
            email="academy@test.com",
            phone="010000"
        )

    def test_create_owner(self):
        user = User.objects.create_user(
            academy=self.academy,
            full_name="Owner",
            email="owner@test.com",
            password="123456",
            phone="01000",
            role=User.Roles.OWNER,
            educational_level=1,
            parent_phone="0"
        )

        self.assertEqual(
            user.role,
            User.Roles.OWNER
        )

    def test_password_hashed(self):
        user = User.objects.create_user(
            academy=self.academy,
            full_name="User",
            email="user@test.com",
            password="123456",
            phone="01000",
            role=User.Roles.ADMIN,
            educational_level=1,
            parent_phone="0"
        )

        self.assertTrue(
            user.check_password("123456")
        )

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email="admin@test.com",
            password="123456",
            full_name="Admin",
            phone="01000",
            educational_level=1,
            parent_phone="0"
        )

        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_str(self):
        user = User.objects.create_user(
            academy=self.academy,
            full_name="Ahmed",
            email="ahmed@test.com",
            password="123456",
            phone="01000",
            role=User.Roles.ADMIN,
            educational_level=1,
            parent_phone="0"
        )

        self.assertEqual(
            str(user),
            "Ahmed"
        )


# =========================================================
# SERIALIZERS
# =========================================================

class AcademyRegistrationSerializerTests(TestCase):

    def test_passwords_match(self):

        data = {
            "academy_name": "Academy",
            "academy_email": "academy@test.com",
            "academy_phone": "0100",
            "address": "Egypt",
            "full_name": "Owner",
            "email": "owner@test.com",
            "phone": "0100",
            "password": "123456",
            "confirm_password": "123456",
        }

        serializer = AcademyRegistrationSerializer(
            data=data
        )

        self.assertTrue(
            serializer.is_valid()
        )

    def test_passwords_not_match(self):

        data = {
            "academy_name": "Academy",
            "academy_email": "academy@test.com",
            "academy_phone": "0100",
            "address": "Egypt",
            "full_name": "Owner",
            "email": "owner@test.com",
            "phone": "0100",
            "password": "123456",
            "confirm_password": "000000",
        }

        serializer = AcademyRegistrationSerializer(
            data=data
        )

        self.assertFalse(
            serializer.is_valid()
        )

    def test_create_owner_and_academy(self):

        serializer = AcademyRegistrationSerializer(
            data={
                "academy_name": "Academy",
                "academy_email": "academy@test.com",
                "academy_phone": "0100",
                "address": "Egypt",
                "full_name": "Owner",
                "email": "owner@test.com",
                "phone": "0100",
                "password": "123456",
                "confirm_password": "123456",
            }
        )

        serializer.is_valid(raise_exception=True)

        owner = serializer.save()

        self.assertEqual(
            owner.role,
            User.Roles.OWNER
        )

        self.assertEqual(
            Academy.objects.count(),
            1
        )


class StudentSerializerTests(TestCase):

    def test_student_password_validation(self):

        serializer = StudentCreateSerializer(
            data={
                "full_name": "Student",
                "email": "student@test.com",
                "phone": "01000",
                "parent_phone": "01111",
                "educational_level": 10,
                "password": "123456",
                "confirm_password": "111111",
            }
        )

        self.assertFalse(
            serializer.is_valid()
        )


# =========================================================
# PERMISSIONS
# =========================================================

class PermissionTests(TestCase):

    def setUp(self):

        self.academy = Academy.objects.create(
            name="Academy",
            email="academy@test.com",
            phone="01000",
            subscription_end=timezone.now().date() + timedelta(days=5)
        )

        self.owner = User.objects.create_user(
            academy=self.academy,
            full_name="Owner",
            email="owner@test.com",
            password="123456",
            phone="01000",
            role=User.Roles.OWNER,
            educational_level=1,
            parent_phone="0"
        )

    def test_is_owner_permission(self):

        permission = IsOwner()

        class Request:
            user = self.owner

        self.assertTrue(
            permission.has_permission(
                Request(),
                None
            )
        )

    def test_subscription_permission(self):

        permission = ActiveSubscriptionRequired()

        class Request:
            user = self.owner

        self.assertTrue(
            permission.has_permission(
                Request(),
                None
            )
        )


# =========================================================
# API TESTS
# =========================================================

class RegisterApiTests(APITestCase):

    def test_register_success(self):

        response = self.client.post(
            "/api/core/register/",
            {
                "academy_name": "Academy",
                "academy_email": "academy@test.com",
                "academy_phone": "0100",
                "address": "Egypt",
                "full_name": "Owner",
                "email": "owner@test.com",
                "phone": "0100",
                "password": "123456",
                "confirm_password": "123456",
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            201
        )

    def test_register_invalid_password_confirmation(self):

        response = self.client.post(
            "/api/core/register/",
            {
                "academy_name": "Academy",
                "academy_email": "academy@test.com",
                "academy_phone": "0100",
                "address": "Egypt",
                "full_name": "Owner",
                "email": "owner@test.com",
                "phone": "0100",
                "password": "123456",
                "confirm_password": "111111",
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            400
        )


class LoginApiTests(APITestCase):

    def setUp(self):

        self.academy = Academy.objects.create(
            name="Academy",
            email="academy@test.com",
            phone="0100"
        )

        self.user = User.objects.create_user(
            academy=self.academy,
            full_name="Owner",
            email="owner@test.com",
            password="123456",
            phone="01000",
            role=User.Roles.OWNER,
            educational_level=1,
            parent_phone="0"
        )

    def test_login_success(self):

        response = self.client.post(
            "/api/core/login/",
            {
                "email": "owner@test.com",
                "password": "123456"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            200
        )

    def test_login_wrong_password(self):

        response = self.client.post(
            "/api/core/login/",
            {
                "email": "owner@test.com",
                "password": "wrong"
            },
            format="json"
        )

        self.assertNotEqual(
            response.status_code,
            200
        )


class EducationalLevelApiTests(APITestCase):

    def test_get_educational_levels(self):

        response = self.client.get(
            "/api/core/educational_levels/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertTrue(
            len(response.data) > 0
        )


class LogoutApiTests(APITestCase):

    def test_logout(self):

        response = self.client.post(
            "/api/core/logout/"
        )

        self.assertEqual(
            response.status_code,
            200
        )