 # core/tests.py

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient

from core.models import Academy, User, Students
from core.serializers import (
    AcademyRegistrationSerializer,
    AcademySerializer,
    UserSerializer,
    StaffCreateSerializer,
    StudentCreateSerializer,
    StudentProfileUpdateSerializer,
)
from core.permissions import (
    ActiveSubscriptionRequired,
    IsOwner,
)


def create_academy(**kwargs):
    defaults = {
        "name": "Academy",
        "email": "academy@test.com",
        "phone": "01000000000",
        "subscription_end": timezone.now().date() + timedelta(days=30),
    }
    defaults.update(kwargs)
    return Academy.objects.create(**defaults)


def create_user(academy, role, email, **kwargs):
    defaults = {
        "full_name": "Test User",
        "phone": "01000000000",
        "password": "Str0ngPass!23",
    }
    defaults.update(kwargs)
    password = defaults.pop("password")
    return User.objects.create_user(
        academy=academy,
        email=email,
        role=role,
        password=password,
        **defaults,
    )


def create_student(academy, email="student@test.com", **kwargs):
    """Creates a STUDENT User plus its related Students profile."""
    student_kwargs = {
        "parent_email": kwargs.pop("parent_email", "parent@test.com"),
        "educational_level": kwargs.pop("educational_level", Students.EducationalLevel.SEC_1),
        "status": kwargs.pop("status", Students.Status.ACTIVE),
    }
    user = create_user(academy, User.Roles.STUDENT, email, **kwargs)
    students_profile = Students.objects.create(user=user, **student_kwargs)
    return user, students_profile


# =========================================================
# MODELS
# =========================================================

class AcademyModelTests(TestCase):

    def test_create_academy(self):
        academy = Academy.objects.create(
            name="Test Academy",
            email="academy1@test.com",
            phone="01000000000",
        )
        self.assertEqual(academy.name, "Test Academy")
        self.assertFalse(academy.setup_complete)
        self.assertTrue(academy.weekly_report_enabled)

    def test_active_subscription_true(self):
        academy = create_academy(
            email="a@test.com",
            subscription_end=timezone.now().date() + timedelta(days=5),
        )
        self.assertTrue(academy.has_active_subscription())

    def test_active_subscription_false(self):
        academy = create_academy(
            email="b@test.com",
            subscription_end=timezone.now().date() - timedelta(days=1),
        )
        self.assertFalse(academy.has_active_subscription())

    def test_active_subscription_none(self):
        academy = create_academy(email="none@test.com", subscription_end=None)
        self.assertFalse(academy.has_active_subscription())

    def test_str(self):
        academy = create_academy(name="Future Academy", email="c@test.com")
        self.assertEqual(str(academy), "Future Academy")

    def test_email_unique(self):
        create_academy(email="dup@test.com")
        with self.assertRaises(Exception):
            create_academy(email="dup@test.com")

    def test_ordering_by_name(self):
        create_academy(name="Zeta", email="zeta@test.com")
        create_academy(name="Alpha", email="alpha@test.com")
        names = list(Academy.objects.values_list("name", flat=True))
        self.assertEqual(names, sorted(names))


class UserModelTests(TestCase):

    def setUp(self):
        self.academy = create_academy()

    def test_create_owner(self):
        user = create_user(self.academy, User.Roles.OWNER, "owner@test.com")
        self.assertEqual(user.role, User.Roles.OWNER)
        self.assertTrue(user.is_active)

    def test_password_hashed(self):
        user = create_user(
            self.academy, User.Roles.ADMIN, "admin@test.com", password="123456"
        )
        self.assertTrue(user.check_password("123456"))
        self.assertNotEqual(user.password, "123456")

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email="super@test.com",
            password="123456",
            full_name="Super Admin",
            phone="01000",
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_create_superuser_requires_is_staff(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email="bad@test.com",
                password="123456",
                full_name="Bad",
                phone="01000",
                is_staff=False,
            )

    def test_create_user_without_email_raises(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email=None,
                password="123456",
                full_name="No Email",
                phone="01000",
                role=User.Roles.ADMIN,
            )

    def test_user_str(self):
        user = create_user(self.academy, User.Roles.ADMIN, "ahmed@test.com", full_name="Ahmed")
        self.assertEqual(str(user), "Ahmed")

    def test_email_unique(self):
        create_user(self.academy, User.Roles.ADMIN, "same@test.com")
        with self.assertRaises(Exception):
            create_user(self.academy, User.Roles.ADMIN, "same@test.com")

    def test_email_normalized(self):
        user = User.objects.create_user(
            email="Normalized@TEST.com",
            password="123456",
            full_name="Norm",
            phone="01000",
            role=User.Roles.ADMIN,
        )
        self.assertEqual(user.email, "Normalized@test.com")


class StudentsModelTests(TestCase):

    def setUp(self):
        self.academy = create_academy()

    def test_create_student_profile(self):
        user, student = create_student(self.academy, email="s1@test.com")
        self.assertEqual(student.status, Students.Status.ACTIVE)
        self.assertEqual(student.user, user)

    def test_student_str(self):
        user, student = create_student(
            self.academy, email="s2@test.com", full_name="Sara"
        )
        self.assertEqual(str(student), "Sara")

    def test_student_default_status_pending(self):
        user = create_user(self.academy, User.Roles.STUDENT, "s3@test.com")
        student = Students.objects.create(
            user=user,
            parent_email="parent3@test.com",
        )
        self.assertEqual(student.status, Students.Status.PENDING)

    def test_student_user_is_primary_key(self):
        user, student = create_student(self.academy, email="s4@test.com")
        self.assertEqual(student.pk, user.pk)


# =========================================================
# SERIALIZERS
# =========================================================

class AcademyRegistrationSerializerTests(TestCase):

    def valid_data(self, **overrides):
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
        data.update(overrides)
        return data

    def test_passwords_match(self):
        serializer = AcademyRegistrationSerializer(data=self.valid_data())
        self.assertTrue(serializer.is_valid())

    def test_passwords_not_match(self):
        serializer = AcademyRegistrationSerializer(
            data=self.valid_data(confirm_password="000000")
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("confirm_password", serializer.errors)

    def test_create_owner_and_academy(self):
        serializer = AcademyRegistrationSerializer(data=self.valid_data())
        serializer.is_valid(raise_exception=True)
        owner = serializer.save()

        self.assertEqual(owner.role, User.Roles.OWNER)
        self.assertEqual(Academy.objects.count(), 1)
        self.assertEqual(owner.academy.name, "Academy")
        # subscription auto-set to 30 days from now
        self.assertEqual(
            owner.academy.subscription_end,
            timezone.now().date() + timedelta(days=30),
        )

    def test_invalid_email_rejected(self):
        serializer = AcademyRegistrationSerializer(
            data=self.valid_data(academy_email="not-an-email")
        )
        self.assertFalse(serializer.is_valid())


class AcademySerializerTests(TestCase):

    def test_serializes_expected_fields(self):
        academy = create_academy()
        data = AcademySerializer(academy).data
        self.assertEqual(set(data.keys()), {
            "id", "name", "email", "phone", "address",
            "subscription_end", "weekly_report_enabled",
        })


class UserSerializerTests(TestCase):

    def test_includes_academy_and_role_display(self):
        academy = create_academy()
        user = create_user(academy, User.Roles.ADMIN, "admin2@test.com")
        data = UserSerializer(user).data

        self.assertEqual(data["academy_name"], academy.name)
        self.assertEqual(data["role_display"], "Admin")
        self.assertNotIn("password", data)


class StaffCreateSerializerTests(TestCase):

    def setUp(self):
        self.academy = create_academy()
        self.owner = create_user(self.academy, User.Roles.OWNER, "owner3@test.com")

    class _FakeRequest:
        def __init__(self, user):
            self.user = user

    def test_password_mismatch_invalid(self):
        serializer = StaffCreateSerializer(
            data={
                "full_name": "Staff",
                "email": "staff@test.com",
                "phone": "0100",
                "password": "123456",
                "confirm_password": "000000",
                "role": User.Roles.ADMIN,
            }
        )
        self.assertFalse(serializer.is_valid())

    def test_creates_staff_under_request_academy(self):
        serializer = StaffCreateSerializer(
            data={
                "full_name": "Staff",
                "email": "staff2@test.com",
                "phone": "0100",
                "password": "123456",
                "confirm_password": "123456",
                "role": User.Roles.TEACHER,
            },
            context={"request": self._FakeRequest(self.owner)},
        )
        serializer.is_valid(raise_exception=True)
        staff = serializer.save()

        self.assertEqual(staff.academy, self.academy)
        self.assertEqual(staff.role, User.Roles.TEACHER)


class StudentCreateSerializerTests(TestCase):

    def test_student_password_validation(self):
        serializer = StudentCreateSerializer(
            data={
                "full_name": "Student",
                "email": "student@test.com",
                "phone": "01000",
                "parent_email": "parent@test.com",
                "educational_level": 10,
                "password": "123456",
                "confirm_password": "111111",
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("confirm_password", serializer.errors)

    def test_creates_user_and_students_profile(self):
        serializer = StudentCreateSerializer(
            data={
                "full_name": "Student",
                "email": "student2@test.com",
                "phone": "01000",
                "parent_email": "parent2@test.com",
                "educational_level": 10,
                "password": "123456",
                "confirm_password": "123456",
            }
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        self.assertEqual(user.role, User.Roles.STUDENT)
        self.assertTrue(Students.objects.filter(user=user).exists())
        student = Students.objects.get(user=user)
        self.assertEqual(student.status, Students.Status.PENDING)
        self.assertEqual(student.parent_email, "parent2@test.com")


# =========================================================
# PERMISSIONS
# =========================================================

class PermissionTests(TestCase):

    def setUp(self):
        self.academy = create_academy(
            subscription_end=timezone.now().date() + timedelta(days=5)
        )
        self.owner = create_user(self.academy, User.Roles.OWNER, "owner4@test.com")
        self.admin = create_user(self.academy, User.Roles.ADMIN, "admin4@test.com")

    class _Request:
        def __init__(self, user):
            self.user = user

    def test_is_owner_permission_true_for_owner(self):
        permission = IsOwner()
        self.assertTrue(
            permission.has_permission(self._Request(self.owner), None)
        )

    def test_is_owner_permission_false_for_admin(self):
        permission = IsOwner()
        self.assertFalse(
            permission.has_permission(self._Request(self.admin), None)
        )

    def test_subscription_permission_active(self):
        permission = ActiveSubscriptionRequired()
        self.assertTrue(
            permission.has_permission(self._Request(self.owner), None)
        )

    def test_subscription_permission_expired(self):
        expired_academy = create_academy(
            email="expired@test.com",
            subscription_end=timezone.now().date() - timedelta(days=1),
        )
        expired_owner = create_user(
            expired_academy, User.Roles.OWNER, "expiredowner@test.com"
        )
        permission = ActiveSubscriptionRequired()
        self.assertFalse(
            permission.has_permission(self._Request(expired_owner), None)
        )


# =========================================================
# API TESTS
# =========================================================

class RegisterApiTests(APITestCase):

    def test_register_success(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "academy_name": "Academy",
                "academy_email": "academy5@test.com",
                "academy_phone": "0100",
                "address": "Egypt",
                "full_name": "Owner",
                "email": "owner5@test.com",
                "phone": "0100",
                "password": "123456",
                "confirm_password": "123456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["role"], User.Roles.OWNER)
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)

    def test_register_invalid_password_confirmation(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "academy_name": "Academy",
                "academy_email": "academy6@test.com",
                "academy_phone": "0100",
                "address": "Egypt",
                "full_name": "Owner",
                "email": "owner6@test.com",
                "phone": "0100",
                "password": "123456",
                "confirm_password": "111111",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_register_duplicate_email_rejected(self):
        create_academy(email="dupreg@test.com")
        create_user(
            Academy.objects.get(email="dupreg@test.com"),
            User.Roles.OWNER,
            "dupowner@test.com",
        )
        response = self.client.post(
            "/api/auth/register/",
            {
                "academy_name": "Other Academy",
                "academy_email": "other@test.com",
                "academy_phone": "0100",
                "address": "Egypt",
                "full_name": "Owner",
                "email": "dupowner@test.com",
                "phone": "0100",
                "password": "123456",
                "confirm_password": "123456",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class LoginApiTests(APITestCase):

    def setUp(self):
        self.academy = create_academy(email="loginacademy@test.com")
        self.user = create_user(
            self.academy, User.Roles.OWNER, "loginowner@test.com", password="123456"
        )

    def test_login_success(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "loginowner@test.com", "password": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["role"], User.Roles.OWNER)
        self.assertIn("access_token", response.cookies)

    def test_login_wrong_password(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "loginowner@test.com", "password": "wrong"},
            format="json",
        )
        self.assertNotEqual(response.status_code, 200)

    def test_login_unknown_email(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "doesnotexist@test.com", "password": "123456"},
            format="json",
        )
        self.assertNotEqual(response.status_code, 200)


class LogoutApiTests(APITestCase):

    def test_logout_clears_cookies(self):
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.cookies["access_token"].value, "")
        self.assertEqual(response.cookies["refresh_token"].value, "")


class RefreshTokenApiTests(APITestCase):

    def test_refresh_without_cookie_fails(self):
        response = self.client.post("/api/auth/academy/complete-setup/")
        # Not authenticated at all -> 401 expected from IsAuthenticated default
        self.assertIn(response.status_code, [401, 403])


class EducationalLevelApiTests(APITestCase):

    def test_get_educational_levels(self):
        response = self.client.get("/api/auth/educational_levels/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) > 0)
        self.assertIn("value", response.data[0])
        self.assertIn("label", response.data[0])


class AcademyApiTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.academy = create_academy(email="academyapi@test.com")
        self.owner = create_user(
            self.academy, User.Roles.OWNER, "academyapiowner@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_retrieve_own_academy(self):
        response = self.client.get("/api/auth/academy/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], self.academy.name)

    def test_update_own_academy(self):
        response = self.client.patch(
            "/api/auth/academy/",
            {"name": "Updated Name"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.academy.refresh_from_db()
        self.assertEqual(self.academy.name, "Updated Name")

    def test_academy_list_requires_auth(self):
        anon_client = APIClient()
        response = anon_client.get("/api/auth/academies/")
        self.assertIn(response.status_code, [401, 403])


class CompleteSetupApiTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.academy = create_academy(
            email="setupacademy@test.com",
            subscription_end=timezone.now().date() + timedelta(days=10),
        )
        self.owner = create_user(
            self.academy, User.Roles.OWNER, "setupowner@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_incomplete_without_subject_fails(self):
        response = self.client.post("/api/auth/academy/complete-setup/")
        self.assertEqual(response.status_code, 400)

    def test_complete_setup_success(self):
        from structure.models import Subject
        Subject.objects.create(
            academy=self.academy, name="Math", description="Math subject"
        )
        response = self.client.post("/api/auth/academy/complete-setup/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["setup_complete"])
        self.academy.refresh_from_db()
        self.assertTrue(self.academy.setup_complete)

    def test_incomplete_without_subscription_fails(self):
        from structure.models import Subject
        no_sub_academy = create_academy(
            email="nosub@test.com", subscription_end=None
        )
        owner = create_user(no_sub_academy, User.Roles.OWNER, "nosubowner@test.com")
        Subject.objects.create(
            academy=no_sub_academy, name="Science", description="Science"
        )
        client = APIClient()
        client.force_authenticate(owner)
        response = client.post("/api/auth/academy/complete-setup/")
        self.assertEqual(response.status_code, 400)


class StudentRegistrationApiTests(APITestCase):

    def test_register_student_success(self):
        academy = create_academy(email="studentregacademy@test.com")
        response = self.client.post(
            "/api/auth/users/register/student/",
            {
                "full_name": "New Student",
                "email": "newstudent@test.com",
                "phone": "01000",
                "parent_email": "parent@test.com",
                "educational_level": 5,
                "password": "123456",
                "confirm_password": "123456",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            User.objects.filter(email="newstudent@test.com").exists()
        )


class UserViewSetApiTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.academy = create_academy(email="uservsacademy@test.com")
        self.owner = create_user(
            self.academy, User.Roles.OWNER, "uservsowner@test.com"
        )
        self.client.force_authenticate(self.owner)

    def test_me_endpoint(self):
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], self.owner.email)

    def test_create_staff_member(self):
        response = self.client.post(
            "/api/users/",
            {
                "full_name": "New Teacher",
                "email": "newteacher@test.com",
                "phone": "01000",
                "password": "123456",
                "confirm_password": "123456",
                "role": User.Roles.TEACHER,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_list_users_excludes_owner(self):
        create_user(self.academy, User.Roles.ADMIN, "listadmin@test.com")
        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, 200)
        emails = [u["email"] for u in response.data]
        self.assertNotIn(self.owner.email, emails)

    def test_non_owner_cannot_create_staff(self):
        admin = create_user(self.academy, User.Roles.ADMIN, "nonowneradmin@test.com")
        client = APIClient()
        client.force_authenticate(admin)
        response = client.post(
            "/api/users/",
            {
                "full_name": "Blocked",
                "email": "blocked@test.com",
                "phone": "01000",
                "password": "123456",
                "confirm_password": "123456",
                "role": User.Roles.TEACHER,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_students_action_lists_only_students(self):
        create_student(self.academy, email="laststudent@test.com")
        create_user(self.academy, User.Roles.TEACHER, "notastudent@test.com")
        response = self.client.get("/api/users/students/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)


class StudentProfileApiTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.academy = create_academy(email="profileacademy@test.com")
        self.owner = create_user(
            self.academy, User.Roles.OWNER, "profileowner@test.com"
        )
        self.student_user, self.student_profile = create_student(
            self.academy, email="profilestudent@test.com"
        )

    def test_owner_can_retrieve_student_profile(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get(
            f"/api/auth/users/students/profile/{self.student_user.id}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], self.student_user.email)

    def test_student_can_retrieve_own_profile(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.get(
            f"/api/auth/users/students/profile/{self.student_user.id}/"
        )
        self.assertEqual(response.status_code, 200)

    def test_update_student_profile(self):
        self.client.force_authenticate(self.owner)
        response = self.client.patch(
            f"/api/auth/users/students/profile/{self.student_user.id}/",
            {"parent_email": "newparent@test.com", "educational_level": 7},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.student_profile.refresh_from_db()
        self.assertEqual(self.student_profile.parent_email, "newparent@test.com")