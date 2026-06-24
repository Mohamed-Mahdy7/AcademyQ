from django.test import TestCase
from rest_framework.test import APIClient
from core.models import Academy, User

class ActiveSubscriptionGuardTest(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_user_with_no_academy_gets_permission_denied_not_500(self):
        user = User.objects.create_user(
            email="noacademy@test.com", full_name="No Academy", role=User.Roles.OWNER,
            password="testpass123",
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/alerts/stats/")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "permission_denied")


class AcademyViewTest(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_no_academy_returns_clean_not_found(self):
        user = User.objects.create_user(
            email="noacademy2@test.com", full_name="No Academy", role=User.Roles.OWNER,
            password="testpass123",
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/auth/academy/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["code"], "not_found")


class RefreshTokenViewTest(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_missing_refresh_cookie_returns_clean_auth_failure(self):
        response = self.client.post("/api/auth/refresh/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data["code"], "permission_denied")

    def test_invalid_refresh_cookie_returns_clean_auth_failure(self):
        self.client.cookies["refresh_token"] = "garbage-not-a-real-token"
        response = self.client.post("/api/auth/refresh/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data["code"], "permission_denied")