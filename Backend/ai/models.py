from django.db import models
from django.contrib.auth import get_user_model
from pgvector.django import VectorField
import uuid
from ai.agent.models import Alert

User = get_user_model()

class StudentEmbedding(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
        )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="embeddings"
    )
    embedding = VectorField(dimensions=3072)
    source_text = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Embedding({self.student.full_name})"
