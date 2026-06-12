"""
Centralized prompt templates for all AI features.

Rules:
- No database queries.
- No Django model imports.
- Only receive dictionaries and return strings.
"""


def build_report_prompt(context: dict) -> str:

    return f"""
You are an experienced educational performance analyst.

Generate a detailed student performance report.

Student Information:
- Name: {context.get("student_name", "Unknown")}
- Educational Level: {context.get("educational_level", "Unknown")}
- Attendance Rate: {context.get("attendance_rate", 0)}%
- Missed Classes: {context.get("missed_classes", 0)}
- Payment Status: {context.get("payment_status", "Unknown")}
- Teacher Notes:
{context.get("teacher_notes", "No teacher notes available")}

Requirements:
1. Start with a short summary.
2. Highlight strengths.
3. Highlight concerns.
4. Provide actionable recommendations.
5. Keep a professional and supportive tone.
6. Maximum 300 words.

Return plain text only.
"""


def build_risk_alert_prompt(context: dict) -> str:

    return f"""
You are a student retention specialist.

Analyze the following student and explain why they may be at risk.

Student Information:
- Name: {context.get("student_name", "Unknown")}
- Attendance Rate: {context.get("attendance_rate", 0)}%
- Missed Classes: {context.get("missed_classes", 0)}
- Payment Status: {context.get("payment_status", "Unknown")}
- Risk Score: {context.get("risk_score", 0)}

Teacher Notes:
{context.get("teacher_notes", "No notes available")}

Generate:

1. Risk Summary
2. Main Risk Factors
3. Recommended Intervention
4. Parent Message Draft

Return plain text only.
"""


def build_payment_reminder_prompt(context: dict) -> str:

    return f"""
Write a professional payment reminder.

Student Name:
{context.get("student_name", "Unknown")}

Parent Name:
{context.get("parent_name", "Parent")}

Outstanding Balance:
{context.get("outstanding_balance", 0)}

Due Date:
{context.get("due_date", "Not specified")}

Requirements:
- Friendly tone
- Professional tone
- Clear payment request
- Under 120 words
- Do not sound threatening

Return only the reminder text.
"""


def build_attendance_alert_prompt(context: dict) -> str:
    """
    Optional notification template.
    """

    return f"""
Write a message to inform a parent about low attendance.

Student Name:
{context.get("student_name", "Unknown")}

Attendance Rate:
{context.get("attendance_rate", 0)}%

Missed Classes:
{context.get("missed_classes", 0)}

Requirements:
- Friendly tone
- Encourage communication
- Suggest contacting the academy
- Maximum 120 words

Return only the message.
"""


def build_management_summary_prompt(context: dict) -> str:

    return f"""
Generate a weekly academy AI operations summary.

Metrics:

Reports Generated:
{context.get("reports_generated", 0)}

Risk Alerts Generated:
{context.get("alerts_generated", 0)}

Notifications Sent:
{context.get("notifications_sent", 0)}

Estimated AI Cost:
${context.get("estimated_cost", 0)}

Provide:

1. Executive Summary
2. Key Trends
3. Potential Risks
4. Recommendations For Management

Keep the response under 400 words.

Return plain text only.
"""


def build_custom_prompt(
    system_role: str,
    instructions: str,
    context: dict,
) -> str:
    """
    Generic prompt builder for future features.
    """

    context_text = "\n".join(
        f"{key}: {value}"
        for key, value in context.items()
    )

    return f"""
Role:
{system_role}

Instructions:
{instructions}

Context:
{context_text}

Return plain text only.
"""
