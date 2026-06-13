import logging
import time
from google import genai
from django.conf import settings
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