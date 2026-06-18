from ai.utils.prompt_builder import (
    build_report_prompt,
    build_risk_alert_prompt,
    build_payment_reminder_prompt,
    build_management_summary_prompt,
)
from ai.utils.gemini_client import generate_text


report_context = {
    "student_name": "Mohamed Mahdy",
    "educational_level": "Secondary",
    "attendance_rate": 72,
    "missed_classes": 5,
    "payment_status": "Pending",
    "teacher_notes": "Needs more participation.",
    "similar_students": [
        {
            "student_name": "Ahmed",
            "educational_level": "Secondary",
        },
        {
            "student_name": "Ali",
            "educational_level": "Secondary",
        },
    ],
}

risk_context = {
    **report_context,
    "risk_score": 75,
}

payment_context = {
    "student_name": "Mohamed Mahdy",
    "parent_name": "Mr. Mahdy",
    "outstanding_balance": 1200,
    "due_date": "2026-06-10",
}

management_context = {
    "reports_generated": 150,
    "alerts_generated": 25,
    "notifications_sent": 80,
    "estimated_cost": 12.45,
}

report_prompt = (build_report_prompt(report_context))
report_result = generate_text(report_prompt)

print("\nREPORT OUTPUT")
print("=" * 80)
print(report_result)

print("\n\n")


risk_prompt = (build_risk_alert_prompt(risk_context))
risk_result = generate_text(risk_prompt)

print("\nRISK OUTPUT")
print("=" * 80)
print(risk_result)

print("\n\n")

payment_prompt = (build_payment_reminder_prompt(payment_context))
payment_result = generate_text(payment_prompt)

print("\nPAYMENT REMINDER OUTPUT")
print("=" * 80)
print(payment_result)

print("\n\n")


management_pormpt = (build_management_summary_prompt(management_context))
management_result = generate_text(management_pormpt)

print("\nMANAGEMENT SUMMARY OUTPUT")
print("=" * 80)
print(management_result)