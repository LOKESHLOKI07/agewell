"""Shared phone OTP store + WhatsApp (or demo) delivery."""
from __future__ import annotations

import asyncio

from fastapi import HTTPException, status

from app.core.config import settings
from app.modules.auth.otp_service import can_send_otp, generate_otp_code, store_otp
from app.modules.auth.whatsapp import send_otp_whatsapp, whatsapp_configured


def phone_otp_key(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    return f"phone:{digits}"


async def dispatch_phone_otp(phone: str) -> dict:
    """Generate, store, and deliver a phone OTP via WhatsApp when configured.

    Outside production, returns debug_code when WhatsApp is off or send fails,
    so the demo can still complete the flow.
    """
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter a valid mobile number.")

    key = phone_otp_key(digits)
    can_send_otp(key)
    code = generate_otp_code()
    store_otp(key, code)

    debug_code: str | None = None
    channel = "whatsapp"

    if whatsapp_configured():
        try:
            await asyncio.to_thread(send_otp_whatsapp, digits, code)
        except Exception as exc:
            print(f"[EldCare WhatsApp OTP] send failed for {digits}: {exc}; code is {code}")
            if settings.ENVIRONMENT != "production":
                debug_code = code
                channel = "demo"
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="We could not send the WhatsApp code. Please try again shortly.",
                )
    else:
        print(f"[EldCare WhatsApp OTP] not configured; code for {digits} is {code}")
        if settings.ENVIRONMENT != "production":
            debug_code = code
            channel = "demo"
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="WhatsApp OTP is not configured.",
            )

    message = (
        "We sent a verification code on WhatsApp."
        if channel == "whatsapp"
        else "WhatsApp is not live yet — use the demo code shown (also in the API console)."
    )
    return {
        "message": message,
        "channel": channel,
        "contact": digits,
        "debug_code": debug_code,
    }
