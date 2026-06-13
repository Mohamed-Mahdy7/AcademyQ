from django.test import TestCase
from ai.utils.gemini_client import generate_text


class GeminiClientTest(TestCase):

    def test_generate_text(self):
        response = generate_text(
            "Reply with exactly: WORKING"
        )

        self.assertIn("WORKING", response.upper())