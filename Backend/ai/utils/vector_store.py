from ai.models import StudentEmbedding
from pgvector.django import CosineDistance

def find_similar_students(student, limit=5):
    try:
        embedding_record = student.embeddings.latest("updated_at")
    except StudentEmbedding.DoesNotExist:
        return []

    results = (
        StudentEmbedding.objects
        .filter(student__academy_id=student.academy_id)
        .exclude(student=student)
        .annotate(
            distance=CosineDistance("embedding", embedding_record.embedding)
        )
        .order_by("distance")[:limit]
    )

    return [item.student for item in results]