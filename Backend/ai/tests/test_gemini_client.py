from django.test import TestCase
from django.core.cache import cache
from decimal import Decimal
from unittest.mock import MagicMock, patch
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
        cache.clear()

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


class AIUsageLogCostTest(TestCase):
    """
    Verifies that token counts and costs are stored exactly right.
    Uses known inputs so the expected cost is calculable by hand.
    """

    def setUp(self):
        self.academy = Academy.objects.create(
            name="Cost Test Academy",
            email="cost@test.com",
        )

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_cost_stored_matches_manual_calculation(self, mock_generate):
        # 200 input tokens, 80 visible output, 40 thinking tokens
        # Expected:
        #   input  = (200 * 0.30)  / 1,000,000 = 0.000060
        #   output = (120 * 2.50)  / 1,000,000 = 0.000300  (80 + 40 thinking)
        #   total  =                              0.000360
        mock_generate.return_value = FakeGeminiResponse(
            "response text",
            prompt_tokens=200,
            candidates_tokens=80,
            thoughts_tokens=40,
        )

        generate_text(prompt="test prompt", feature="report_card", academy=self.academy)

        log = AIUsageLog.objects.get()
        self.assertEqual(log.prompt_token, 200)
        self.assertEqual(log.completion_token, 120)   # 80 + 40
        self.assertEqual(log.total_cost_usd, Decimal("0.000360"))
        self.assertEqual(log.feature, "report_card")
        self.assertEqual(log.academy, self.academy)
        self.assertTrue(log.succeeded)

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_thinking_tokens_billed_at_output_rate(self, mock_generate):
        # Same visible output, double the thinking -- cost should increase
        mock_generate.return_value = FakeGeminiResponse(
            "response",
            prompt_tokens=100,
            candidates_tokens=50,
            thoughts_tokens=0,
        )
        generate_text(prompt="p1", feature="report_card", academy=self.academy)

        mock_generate.return_value = FakeGeminiResponse(
            "response",
            prompt_tokens=100,
            candidates_tokens=50,
            thoughts_tokens=100,   # 100 extra thinking tokens
        )
        generate_text(prompt="p2", feature="report_card", academy=self.academy)

        no_thinking, with_thinking = AIUsageLog.objects.order_by("called_at")
        self.assertLess(no_thinking.total_cost_usd, with_thinking.total_cost_usd)
        # difference should be exactly 100 tokens at output rate
        expected_diff = (Decimal(100) * Decimal("2.50")) / Decimal(1_000_000)
        self.assertEqual(
            with_thinking.total_cost_usd - no_thinking.total_cost_usd,
            expected_diff,
        )

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_failed_call_logs_zero_cost_and_succeeded_false(self, mock_generate):
        from google.genai import errors
        mock_generate.side_effect = errors.ClientError(400, {"message": "bad request"}, None)

        with self.assertRaises(errors.ClientError):
            generate_text(prompt="test", feature="report_card", academy=self.academy)

        log = AIUsageLog.objects.get()
        self.assertFalse(log.succeeded)
        self.assertEqual(log.total_cost_usd, Decimal("0"))
        self.assertEqual(log.prompt_token, 0)
        self.assertEqual(log.completion_token, 0)

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_no_usage_metadata_logs_zero_tokens_and_zero_cost(self, mock_generate):
        # If Gemini ever returns a response with no usage_metadata,
        # we should log zeros rather than crash.
        response = MagicMock()
        response.text = "hello"
        response.usage_metadata = None
        mock_generate.return_value = response

        generate_text(prompt="test", feature="report_card", academy=self.academy)

        log = AIUsageLog.objects.get()
        self.assertEqual(log.prompt_token, 0)
        self.assertEqual(log.completion_token, 0)
        self.assertEqual(log.total_cost_usd, Decimal("0"))
        self.assertTrue(log.succeeded)   # response came back, just no metadata

class RedisCacheTest(TestCase):

    def setUp(self):
        self.academy = Academy.objects.create(name="Cache Academy", email="cache@test.com")
        cache.clear()

    def tearDown(self):
        cache.clear()

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_second_call_hits_cache_not_api(self, mock_generate):
        mock_generate.return_value = FakeGeminiResponse(
            "cached response", prompt_tokens=50, candidates_tokens=20,
        )
        prompt = "Write a report for Ahmed."

        first = generate_text(prompt=prompt, feature="report_card", academy=self.academy)
        second = generate_text(prompt=prompt, feature="report_card", academy=self.academy)

        self.assertEqual(first, second)
        mock_generate.assert_called_once()

        miss_log, hit_log = AIUsageLog.objects.order_by("called_at")
        self.assertFalse(miss_log.cache_hit)
        self.assertTrue(hit_log.cache_hit)

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_cache_hit_logs_zero_cost_and_cache_hit_true(self, mock_generate):
        mock_generate.return_value = FakeGeminiResponse(
            "response", prompt_tokens=50, candidates_tokens=20,
        )
        prompt = "Same prompt."

        generate_text(prompt=prompt, feature="report_card", academy=self.academy)
        generate_text(prompt=prompt, feature="report_card", academy=self.academy)

        cache_hit_log = AIUsageLog.objects.first()  # newest, ordering = ["-called_at"]
        self.assertEqual(cache_hit_log.total_cost_usd, Decimal("0"))
        self.assertTrue(cache_hit_log.cache_hit)

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_different_prompts_miss_cache(self, mock_generate):
        mock_generate.return_value = FakeGeminiResponse(
            "response", prompt_tokens=10, candidates_tokens=5,
        )
        generate_text(prompt="Prompt A", feature="report_card", academy=self.academy)
        generate_text(prompt="Prompt B", feature="report_card", academy=self.academy)

        self.assertEqual(mock_generate.call_count, 2)
        self.assertEqual(AIUsageLog.objects.filter(cache_hit=True).count(), 0)

    @patch("ai.utils.gemini_client.GeminiClient.generate")
    def test_unpriced_model_not_confused_with_cache_hit(self, mock_generate):
        """
        Regression test for the exact bug we caught: a real API call on a
        model with no pricing entry also logs cost=0. That must not be
        mistaken for a cache hit.
        """
        from django.test import override_settings

        mock_generate.return_value = FakeGeminiResponse(
            "response", prompt_tokens=100, candidates_tokens=50,
        )
        with override_settings(GEMINI_MODEL="some-future-model"):
            generate_text(prompt="Unpriced model call", feature="report_card", academy=self.academy)

        log = AIUsageLog.objects.get()
        self.assertEqual(log.total_cost_usd, Decimal("0"))
        self.assertTrue(log.succeeded)
        self.assertFalse(log.cache_hit)

class ThinkingDisabledTest(TestCase):

    def setUp(self):
        self.academy = Academy.objects.create(name="Thinking Test Academy", email="thinking@test.com")

    @patch("ai.utils.gemini_client.gemini_client.client.models.generate_content")
    def test_thinking_budget_is_zero(self, mock_generate_content):
        mock_generate_content.return_value = FakeGeminiResponse(
            "response", prompt_tokens=10, candidates_tokens=5,
        )

        generate_text(prompt="test", feature="report_card", academy=self.academy)

        _, kwargs = mock_generate_content.call_args
        self.assertEqual(kwargs["config"].thinking_config.thinking_budget, 0)
