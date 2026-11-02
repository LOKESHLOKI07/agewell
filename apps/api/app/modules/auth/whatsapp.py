"""WhatsApp OTP delivery via Meta Cloud API (optional).

When credentials are missing, callers fall back to demo/debug delivery.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request

from app.core.config import settings


def whatsapp_configured() -> bool:
    return bool(
        (settings.WHATSAPP_TOKEN or "").strip()
        and (settings.WHATSAPP_PHONE_NUMBER_ID or "").strip()
        and (settings.WHATSAPP_OTP_TEMPLATE or "").strip()
    )


def normalize_whatsapp_to(phone: str) -> str:
    """Return digits-only international number (no +). Default India 91 for 10-digit mobiles."""
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if not digits:
        raise ValueError("Mobile number is required")
    if digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    country = (settings.WHATSAPP_DEFAULT_COUNTRY_CODE or "91").strip() or "91"
    if len(digits) == 10 and country:
        digits = f"{country}{digits}"
    return digits


def send_otp_whatsapp(phone: str, code: str) -> None:
    """Send an approved WhatsApp template with the OTP as the first body parameter.

    Create a template in Meta Business Manager such as:
      Body: Your EldCare verification code is {{1}}. It expires in 10 minutes.
    Then set WHATSAPP_OTP_TEMPLATE to that template name.
    """
    if not whatsapp_configured():
        raise RuntimeError("WhatsApp is not configured")

    to = normalize_whatsapp_to(phone)
    phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID.strip()
    token = settings.WHATSAPP_TOKEN.strip()
    template = settings.WHATSAPP_OTP_TEMPLATE.strip()
    lang = (settings.WHATSAPP_OTP_TEMPLATE_LANG or "en").strip() or "en"
    api_version = (settings.WHATSAPP_API_VERSION or "v21.0").strip() or "v21.0"

    url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template,
            "language": {"code": lang},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": code}],
                }
            ],
        },
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"WhatsApp send failed ({exc.code}): {body}") from exc
