from django.db import IntegrityError
from rest_framework import exceptions as drf_exceptions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from django.test import TestCase

from core.exceptions import UpstreamError, RateLimitedError


class ThrowawayView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        exc_type = request.query_params.get("raise")

        if exc_type == "validation":
            raise drf_exceptions.ValidationError({"email": ["This field is required."]})
        if exc_type == "not_found":
            raise drf_exceptions.NotFound()
        if exc_type == "permission":
            raise drf_exceptions.PermissionDenied("Not allowed.")
        if exc_type == "throttled":
            raise drf_exceptions.Throttled(wait=30)
        if exc_type == "upstream":
            raise UpstreamError("Gemini timed out.")
        if exc_type == "rate_limited":
            raise RateLimitedError("Scan limit reached.")
        if exc_type == "integrity":
            raise IntegrityError("duplicate key")
        if exc_type == "unhandled":
            raise AttributeError("boom")

        return Response({"ok": True})


class ExceptionHandlerTest(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = ThrowawayView.as_view()

    def _call(self, raise_type):
        request = self.factory.get(f"/throwaway/?raise={raise_type}")
        return self.view(request)

    def test_validation_error_shape(self):
        response = self._call("validation")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "validation_error")
        self.assertIn("email", response.data["fields"])

    def test_not_found_shape(self):
        response = self._call("not_found")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["code"], "not_found")
        self.assertNotIn("fields", response.data)

    def test_permission_denied_shape(self):
        response = self._call("permission")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "permission_denied")

    def test_throttled_maps_to_rate_limited(self):
        response = self._call("throttled")
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.data["code"], "rate_limited")

    def test_upstream_error_shape(self):
        response = self._call("upstream")
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data["code"], "upstream_error")

    def test_rate_limited_error_shape(self):
        response = self._call("rate_limited")
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.data["code"], "rate_limited")

    def test_integrity_error_returns_friendly_message_not_sql(self):
        response = self._call("integrity")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["code"], "server_error")
        self.assertIn("conflicts", response.data["detail"])

    def test_unhandled_exception_never_leaks_real_exception_text(self):
        response = self._call("unhandled")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["code"], "server_error")
        self.assertNotIn("AttributeError", response.data["detail"])
        self.assertIn("ref:", response.data["detail"])