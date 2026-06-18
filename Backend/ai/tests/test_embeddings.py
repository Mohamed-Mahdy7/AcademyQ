from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase, SimpleTestCase
from google.genai import errors

from ai.models import AIUsageLog, StudentEmbedding
from ai.utils.embeddings import build_embedding_text, generate_embedding, upsert_student_embedding
from core.models import Academy, User

FAKE_VECTOR = [0.1] * 3072


class FakeEmbeddingResponse:
    def __init__(self, values=None):
        self.embeddings = [MagicMock(values=values or FAKE_VECTOR)]


# ------------------------------------------------------------------ #
# build_embedding_text — pure function, no DB needed                  #
# ------------------------------------------------------------------ #

class BuildEmbeddingTextTest(SimpleTestCase):

    def _make_student(self, name="Ahmed Ali", level="Secondary 1", status="Active"):
        student = MagicMock()
        student.full_name = name
        student.get_educational_level_display.return_value = level
        student.get_status_display.return_value = status
        return student

    def test_includes_student_name(self):
        result = build_embedding_text(self._make_student(name="Sara Mohamed"))
        self.assertIn("Sara Mohamed", result)

    def test_includes_educational_level(self):
        result = build_embedding_text(self._make_student(level="Secondary 3"))
        self.assertIn("Secondary 3", result)

    def test_includes_status(self):
        result = build_embedding_text(self._make_student(status="Active"))
        self.assertIn("Active", result)

    def test_returns_non_empty_string(self):
        result = build_embedding_text(self._make_student())
        self.assertIsInstance(result, str)
        self.assertTrue(len(result) > 0)


# ------------------------------------------------------------------ #
# generate_embedding — mock the API call                              #
# ------------------------------------------------------------------ #

class GenerateEmbeddingTest(SimpleTestCase):

    @patch("ai.utils.embeddings.gemini_client.client.models.embed_content")
    def test_returns_vector_on_success(self, mock_embed):
        mock_embed.return_value = FakeEmbeddingResponse(FAKE_VECTOR)
        result = generate_embedding("some student text")
        self.assertEqual(result, FAKE_VECTOR)
        mock_embed.assert_called_once()

    @patch("ai.utils.embeddings.time.sleep")
    @patch("ai.utils.embeddings.gemini_client.client.models.embed_content")
    def test_retries_on_429_then_succeeds(self, mock_embed, mock_sleep):
        mock_embed.side_effect = [
            errors.ClientError(429, {"message": "rate limited"}, None),
            FakeEmbeddingResponse(FAKE_VECTOR),
        ]
        result = generate_embedding("text")
        self.assertEqual(result, FAKE_VECTOR)
        self.assertEqual(mock_embed.call_count, 2)
        mock_sleep.assert_called_once()

    @patch("ai.utils.embeddings.time.sleep")
    @patch("ai.utils.embeddings.gemini_client.client.models.embed_content")
    def test_non_retryable_error_raises_immediately(self, mock_embed, mock_sleep):
        mock_embed.side_effect = errors.ClientError(400, {"message": "bad request"}, None)
        with self.assertRaises(errors.ClientError):
            generate_embedding("text")
        mock_embed.assert_called_once()
        mock_sleep.assert_not_called()

    @patch("ai.utils.embeddings.time.sleep")
    @patch("ai.utils.embeddings.gemini_client.client.models.embed_content")
    def test_exhausts_retries_then_raises(self, mock_embed, mock_sleep):
        mock_embed.side_effect = errors.ServerError(503, {"message": "unavailable"}, None)
        with self.assertRaises(errors.ServerError):
            generate_embedding("text")
        self.assertEqual(mock_embed.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)


# ------------------------------------------------------------------ #
# upsert_student_embedding — needs DB                                 #
# ------------------------------------------------------------------ #

class UpsertStudentEmbeddingTest(TestCase):

    def setUp(self):
        self.academy = Academy.objects.create(
            name="Test Academy",
            email="academy@test.com",
        )
        self.student = User.objects.create(
            email="student@test.com",
            full_name="Test Student",
            role=User.Roles.STUDENT,
            educational_level=User.EducationalLevel.SEC_1,
            status=User.Status.ACTIVE,
            academy=self.academy,
            phone="01000000000",
        )

    @patch("ai.utils.embeddings.generate_embedding")
    def test_creates_embedding_on_first_call(self, mock_generate):
        mock_generate.return_value = FAKE_VECTOR
        result = upsert_student_embedding(self.student, self.academy)
        self.assertIsInstance(result, StudentEmbedding)
        self.assertEqual(result.student, self.student)
        self.assertEqual(StudentEmbedding.objects.count(), 1)

    @patch("ai.utils.embeddings.generate_embedding")
    def test_updates_not_duplicates_on_second_call(self, mock_generate):
        mock_generate.return_value = FAKE_VECTOR
        upsert_student_embedding(self.student, self.academy)
        upsert_student_embedding(self.student, self.academy)
        self.assertEqual(StudentEmbedding.objects.count(), 1)

    @patch("ai.utils.embeddings.generate_embedding")
    def test_logs_usage_to_ai_usage_log(self, mock_generate):
        mock_generate.return_value = FAKE_VECTOR
        upsert_student_embedding(self.student, self.academy)
        log = AIUsageLog.objects.get()
        self.assertEqual(log.feature, AIUsageLog.Feature.EMBEDDING)
        self.assertEqual(log.academy, self.academy)
        self.assertEqual(log.completion_token, 0)
        self.assertTrue(log.succeeded)
        self.assertGreater(log.prompt_token, 0)
        self.assertGreater(log.total_cost_usd, Decimal("0"))

    @patch("ai.utils.embeddings.generate_embedding")
    def test_source_text_saved_correctly(self, mock_generate):
        mock_generate.return_value = FAKE_VECTOR
        upsert_student_embedding(self.student, self.academy)
        embedding = StudentEmbedding.objects.get(student=self.student)
        self.assertIn("Test Student", embedding.source_text)