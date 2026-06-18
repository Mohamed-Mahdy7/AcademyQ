import logging
import time
from decimal import Decimal
from django.conf import settings
from google import genai
from google.genai import errors
from ai.models import AIUsageLog
from .constants import RETRYABLE_STATUS_CODES

logger = logging.getLogger(__name__)


# USD price per 1,000,000 tokens. Thinking tokens are billed at the
# output rate -- they are folded into "completion" cost, not a
# separate tier.
PRICING_PER_MILLION_TOKENS = {
    "gemini-2.5-flash": {"input": Decimal("0.30"), "output": Decimal("2.50")},
    "gemini-2.5-flash-lite": {"input": Decimal("0.10"), "output": Decimal("0.40")},
}


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Decimal:
    pricing = PRICING_PER_MILLION_TOKENS.get(model)
    if pricing is None:
        logger.warning("No pricing entry for model=%s -- logging cost as 0", model)
        return Decimal("0")

    prompt_cost = (Decimal(prompt_tokens) * pricing["input"]) / Decimal(1_000_000)
    completion_cost = (Decimal(completion_tokens) * pricing["output"]) / Decimal(1_000_000)
    return prompt_cost + completion_cost


class GeminiClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return cls._instance

    def generate(self, prompt: str):
        """
        Returns the raw response object (not just .text) so callers
        can read usage_metadata for accurate token/cost tracking.
        """
        return self.client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )


gemini_client = GeminiClient()


def _log_usage(*, academy, feature, model, prompt_tokens, completion_tokens, cost, succeeded):
    AIUsageLog.objects.create(
        academy=academy,
        feature=feature,
        model=model,
        prompt_token=prompt_tokens,
        completion_token=completion_tokens,
        total_cost_usd=cost,
        succeeded=succeeded,
    )


def _extract_token_counts(response):
    usage = getattr(response, "usage_metadata", None)
    if usage is None:
        return 0, 0

    prompt_tokens = getattr(usage, "prompt_token_count", None) or 0
    completion_tokens = (
        (getattr(usage, "candidates_token_count", None) or 0) +
        (getattr(usage, "thoughts_token_count", None) or 0)
    )
    return prompt_tokens, completion_tokens

def generate_text(
    prompt: str,
    feature: str,
    academy,           # required -- pass request.user.academy or the academy FK directly
    retries: int = 3,
    retry_delay: int = 2,
):
    """
    Shared AI entry point. Everybody imports this instead of talking
    to Gemini directly.

    Only retries on transient API errors (429 / 5xx), with exponential
    backoff. Anything else fails immediately -- retrying a 400 or an
    auth error just burns retries * delay seconds for nothing.
    """

    last_error = None

    for attempt in range(retries):
        try:
            start_time = time.time()
            response = gemini_client.generate(prompt)

            prompt_tokens, completion_tokens = _extract_token_counts(response)
            cost = estimate_cost(settings.GEMINI_MODEL, prompt_tokens, completion_tokens)

            _log_usage(
                academy=academy,
                feature=feature,
                model=settings.GEMINI_MODEL,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                cost=cost,
                succeeded=True,
            )

            duration = round(time.time() - start_time, 2)
            logger.info(
                "Gemini request succeeded | attempt=%s | duration=%ss | tokens=%s/%s | cost=$%s",
                attempt + 1, duration, prompt_tokens, completion_tokens, cost,
            )

            return response.text

        except errors.APIError as exc:
            last_error = exc

            if exc.code not in RETRYABLE_STATUS_CODES:
                logger.error(
                    "Gemini request failed with non-retryable error | code=%s | error=%s",
                    exc.code, str(exc),
                )
                _log_usage(
                    academy=academy, feature=feature, model=settings.GEMINI_MODEL,
                    prompt_tokens=0, completion_tokens=0, cost=Decimal("0"), succeeded=False,
                )
                raise

            logger.warning(
                "Gemini request failed | attempt=%s | code=%s | error=%s",
                attempt + 1, exc.code, str(exc),
            )

            if attempt < retries - 1:
                time.sleep(retry_delay * (2 ** attempt))

        except Exception as exc:
            last_error = exc
            logger.error("Gemini request failed with unexpected error | error=%s", str(exc))
            _log_usage(
                academy=academy, feature=feature, model=settings.GEMINI_MODEL,
                prompt_tokens=0, completion_tokens=0, cost=Decimal("0"), succeeded=False,
            )
            raise

    logger.error("Gemini request failed after %s attempts", retries)
    _log_usage(
        academy=academy, feature=feature, model=settings.GEMINI_MODEL,
        prompt_tokens=0, completion_tokens=0, cost=Decimal("0"), succeeded=False,
    )
    raise last_error