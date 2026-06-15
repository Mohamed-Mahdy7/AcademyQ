import requests
from django.conf import settings


def send_sms_infobip(phone, message):
    url = f"{settings.INFOBIP_BASE_URL}/sms/2/text/advanced"

    headers = {
        "Authorization": f"App {settings.INFOBIP_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    payload = {
        "messages": [
            {
                "from": settings.INFOBIP_SENDER,
                "destinations": [{"to": phone}],
                "text": message
            }
        ]
    }

    response = requests.post(url, json=payload, headers=headers)

    try:
        return response.json()
    except Exception:
        return {"error": response.text}