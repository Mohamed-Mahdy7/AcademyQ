from ai.utils.prompt_builder import build_report_prompt
from ai.utils.gemini_client import generate_text

context = {
    "student_name": "Mohamed",
    "attendance_rate": 72,
    "missed_classes": 5,
    "payment_status": "Late"
}

prompt = build_report_prompt(context)

result = generate_text(prompt)

print(result)