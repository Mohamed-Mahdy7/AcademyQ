from ai.utils.rag_engine import get_student_context
from ai.utils.prompt_builder import build_report_prompt
from ai.utils.gemini_client import generate_text
from django.contrib.auth import get_user_model

User = get_user_model()

student = User.objects.filter(
    role=User.Roles.STUDENT
).first()

context = get_student_context(student.id)

prompt = build_report_prompt(context)

response = generate_text(prompt)

print(response)