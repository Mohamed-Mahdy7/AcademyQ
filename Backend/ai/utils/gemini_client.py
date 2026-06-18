import logging
import time
from google import genai
from django.conf import settings
from ai.models import AIUsageLog
from decimal import Decimal

logger = logging.getLogger(__name__)



class GeminiClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)

            cls._instance.client = genai.Client(
                api_key=settings.GEMINI_API_KEY
            )

        return cls._instance

    def generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        return response.text

gemini_client = GeminiClient()


def generate_text(
    prompt: str,
    feature: str,
    academy=None,
    retries: int = 3,
    retry_delay: int = 2,
):
    """
    Shared AI entry point.

    Everybody imports this function instead of talking
    directly to Gemini.
    """
    
    last_error = None

    for attempt in range(retries):
        try:
            start_time = time.time()
            response = gemini_client.generate(prompt)
            prompt_tokens = len(prompt.split())
            completion_tokens = len(response.split())
            prompt_cost = prompt_tokens * 15
            completion_cost = completion_tokens * 60
            estimated_cost = (prompt_cost + completion_cost) 
            
            AIUsageLog.objects.create(
                academy=academy,
                feature=feature,
                model=settings.GEMINI_MODEL,
                prompt_token=prompt_tokens,
                completion_token=completion_tokens,
                total_cost_usd=estimated_cost,
            )
            duration = round(time.time() - start_time, 2)

            logger.info(
                "Gemini request succeeded | attempt=%s | duration=%ss",
                attempt + 1,
                duration,
            )

            return response

        except Exception as exc:
            last_error = exc
            logger.warning(
                "Gemini request failed | attempt=%s | error=%s",
                attempt + 1,
                str(exc),
            )

            if attempt < retries - 1:
                time.sleep(retry_delay)

    logger.error(
        "Gemini request failed after %s attempts",
        retries,
    )

    raise last_error