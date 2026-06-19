from django.contrib.auth import get_user_model
from ai.models import StudentEmbedding
from ai.utils.embeddings import generate_embedding
from ai.utils.vector_store import find_similar_students
from ai.utils.rag_engine import get_student_context

User = get_user_model()

students = User.objects.filter(role=User.Roles.STUDENT)

print("\n--- CREATING EMBEDDINGS ---")

# -----------------------------
# STEP 1: CREATE EMBEDDINGS FOR ALL STUDENTS
# -----------------------------
for student in students[:10]:
    text = f"""
    Student: {student.full_name}
    Attendance: 40%
    Payment Status: Pending
    Missed Classes: 2
    """

    vector = generate_embedding(text)

    StudentEmbedding.objects.create(
        student=student,
        embedding=vector,
        source_text=text
    )

    print(f"Created embedding for: {student.full_name}")

# -----------------------------
# STEP 2: PICK ONE STUDENT FOR TEST
# -----------------------------
target_student = students.first()

print("\n--- TARGET STUDENT ---")
print(target_student.full_name)

# -----------------------------
# STEP 3: TEST SIMILARITY
# -----------------------------
similar = find_similar_students(target_student)

print("\n--- SIMILAR STUDENTS ---")
for s in similar:
    print("-", s.full_name)

# -----------------------------
# STEP 4: TEST FULL RAG CONTEXT
# -----------------------------
context = get_student_context(target_student.id)

print("\n--- CONTEXT ---")
print("Name:", context["student_name"])
print("Attendance:", context["attendance_rate"])
print("Payment:", context["payments"])
print("\n--- SIMILAR STUDENTS (CONTEXT) ---")
for s in context["similar_students"]:
    print(f"Student Name: {s['student_name']} | Level: {s['educational_level']}")