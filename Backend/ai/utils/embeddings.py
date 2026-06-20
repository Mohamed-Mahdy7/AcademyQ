import logging
import time
from decimal import Decimal
from django.conf import settings
from google.genai import errors
from ai.models import AIUsageLog, StudentEmbedding
from ai.utils.gemini_client import gemini_client
from .constants import RETRYABLE_STATUS_CODES
from core.models import Students


logger = logging.getLogger(__name__)

EMBEDDING_COST_PER_TOKEN = Decimal("0.00015") / 1000


def build_embedding_text(student) -> str:
    parts = [
        f"Student: {student.full_name}",
        f"Educational Level: {student.get_educational_level_display()}",
        f"Status: {student.get_status_display()}",
    ]
    return "\n".join(parts)


def generate_embedding(text: str) -> list[float]:
    last_error = None

    for attempt in range(3):
        try:
            response = gemini_client.client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text,
            )
            return response.embeddings[0].values

        except errors.APIError as exc:
            last_error = exc
            if exc.code not in RETRYABLE_STATUS_CODES:
                logger.error(
                    "Embedding failed with non-retryable error | code=%s | error=%s",
                    exc.code, str(exc),
                )
                raise

            logger.warning(
                "Embedding failed | attempt=%s | code=%s", attempt + 1, exc.code,
            )
            if attempt < 2:
                time.sleep(2 * (2 ** attempt))

        except Exception as exc:
            logger.error("Embedding failed with unexpected error | error=%s", str(exc))
            raise

    raise last_error


def upsert_student_embedding(student_id, academy) -> StudentEmbedding:
    student = Students.objects.select_related("user").get(pk=student_id)
    text = build_embedding_text(student.user, student)
    vector = generate_embedding(text)

    token_estimate = len(text.split())
    cost = Decimal(str(token_estimate)) * EMBEDDING_COST_PER_TOKEN

    AIUsageLog.objects.create(
        academy=academy,
        feature=AIUsageLog.Feature.EMBEDDING,
        model=settings.GEMINI_EMBEDDING_MODEL,
        prompt_token=token_estimate,
        completion_token=0,
        total_cost_usd=cost,
        succeeded=True,
    )

    embedding, created = StudentEmbedding.objects.update_or_create(
        student=student,
        defaults={"embedding": vector, "source_text": text},
    )

    logger.info(
        "Student embedding %s | student=%s",
        "created" if created else "updated",
        student.id,
    )
    return embedding