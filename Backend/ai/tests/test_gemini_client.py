from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from google.genai import errors

from ai.utils.gemini_client import generate_text, estimate_cost
from ai.models import AIUsageLog
from core.models import Academy


class FakeUsageMetadata:
    def __init__(self, prompt_token_count=0, candidates_token_count=0, thoughts_token_count=0):
        self.prompt_token_count = prompt_token_count
        self.candidates_token_count = candidates_token_count
        self.thoughts_token_count = thoughts_token_count


class FakeGeminiResponse:
    def __init__(self, text, prompt_tokens=0, candidates_tokens=0, thoughts_tokens=0):
        self.text = text
        self.usage_metadata = FakeUsageMetadata(prompt_tokens, candidates_tokens, thoughts_tokens)


class EstimateCostTest(TestCase):

    def test_known_model_computes_expected_cost(self):
        cost = estimate_cost("gemini-2.5-flash", prompt_tokens=100, completion_tokens=70)
        self.assertEqual(cost, Decimal("0.000205"))

    def test_unknown_model_returns_zero(self):
        cost = estimate_cost("some-future-model", prompt_tokens=1000, completion_tokens=1000)
        self.assertEqual(cost, Decimal("0"))


class GenerateTextTest(TestCase):

    def setUp(self):
        self.academy = Academy.objects.create(name="Test Academy", email="test@academy.com")

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_success_logs_real_tokens_including_thinking(self, mock_generate):
        mock_generate.return_value = FakeGeminiResponse(
            "Hello AI response", prompt_tokens=100, candidates_tokens=50, thoughts_tokens=20,
        )

        result = generate_text(prompt="Write a short report", feature="report_card", academy=self.academy)

        self.assertEqual(result, "Hello AI response")
        mock_generate.assert_called_once_with("Write a short report")

        log = AIUsageLog.objects.get()
        self.assertEqual(log.academy, self.academy)
        self.assertEqual(log.feature, "report_card")
        self.assertTrue(log.succeeded)
        self.assertEqual(log.prompt_token, 100)
        # 50 visible + 20 thinking -- both billed at the output rate
        self.assertEqual(log.completion_token, 70)
        self.assertEqual(log.total_cost_usd, Decimal("0.000205"))

    @patch("ai.utils.gemini_client.time.sleep")
    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_retries_on_transient_error_then_succeeds(self, mock_generate, mock_sleep):
        mock_generate.side_effect = [
            errors.ClientError(429, {"message": "rate limited"}, None),
            FakeGeminiResponse("Recovered", prompt_tokens=10, candidates_tokens=5),
        ]

        result = generate_text(prompt="Hi", feature="report_card", academy=self.academy)

        self.assertEqual(result, "Recovered")
        self.assertEqual(mock_generate.call_count, 2)
        mock_sleep.assert_called_once()

        self.assertTrue(AIUsageLog.objects.get().succeeded)

    @patch("ai.utils.gemini_client.time.sleep")
    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_non_retryable_error_fails_immediately(self, mock_generate, mock_sleep):
        mock_generate.side_effect = errors.ClientError(400, {"message": "bad request"}, None)

        with self.assertRaises(errors.ClientError):
            generate_text(prompt="Hi", feature="report_card", academy=self.academy)

        mock_generate.assert_called_once()
        mock_sleep.assert_not_called()

        log = AIUsageLog.objects.get()
        self.assertFalse(log.succeeded)
        self.assertEqual(log.total_cost_usd, Decimal("0"))

    @patch("ai.utils.gemini_client.time.sleep")
    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_exhausts_retries_then_raises(self, mock_generate, mock_sleep):
        mock_generate.side_effect = errors.ServerError(503, {"message": "unavailable"}, None)

        with self.assertRaises(errors.ServerError):
            generate_text(prompt="Hi", feature="report_card", academy=self.academy, retries=3, retry_delay=1)

        self.assertEqual(mock_generate.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)  # backoff between attempts 1→2 and 2→3
        self.assertFalse(AIUsageLog.objects.get().succeeded)