from django.test import TestCase
from unittest.mock import patch, MagicMock
from ai.tests.test_gemini_client import FakeGeminiResponse
from ai.utils.gemini_client import generate_text
from ai.models import AIUsageLog
from core.models import Academy


class GenerateTextTest(TestCase):

    def setUp(self):
        self.academy = Academy.objects.create(
            name="Test Academy",
            email="test@academy.com",
        )

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_generate_text_creates_usage_log_and_returns_response(self, mock_generate):
        """
        Test that:
        - Gemini is called
        - AIUsageLog is created
        - response is returned correctly
        """

        # Arrange
        mock_generate.return_value = FakeGeminiResponse(
            "Hello AI response",
            prompt_tokens=10,
            candidates_tokens=5,
        )

        prompt = "Write a short report"
        feature = "report_card"

        # Act
        result = generate_text(
            prompt=prompt,
            feature=feature,
            academy=self.academy,
        )

        # Assert response returned
        self.assertEqual(result, "Hello AI response")

        # Assert Gemini was called once
        mock_generate.assert_called_once_with(prompt)

        # Assert usage log created
        log = AIUsageLog.objects.first()
        self.assertIsNotNone(log)

        self.assertEqual(log.academy, self.academy)
        self.assertEqual(log.feature, feature)
        self.assertEqual(log.model, "gemini-2.5-flash" if hasattr(log, "model") else log.model)

        # token sanity checks (simple heuristic)
        self.assertGreater(log.prompt_token, 0)
        self.assertGreater(log.completion_token, 0)
        self.assertGreater(log.total_cost_usd, 0)