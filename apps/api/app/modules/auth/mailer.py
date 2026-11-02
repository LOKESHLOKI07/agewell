import smtplib
from email.message import EmailMessage

from app.core.config import settings


def smtp_configured() -> bool:
    return bool(settings.SMTP_USER and settings.SMTP_PASS)


def send_otp_email(to_email: str, code: str) -> None:
    if not smtp_configured():
        raise RuntimeError("SMTP is not configured")

    message = EmailMessage()
    message["Subject"] = "Your EldCare verification code"
    message["From"] = settings.SMTP_FROM or settings.SMTP_USER
    message["To"] = to_email
    message.set_content(
        f"Your EldCare verification code is {code}.\n\n"
        "It expires in 10 minutes. If you did not request this, you can ignore this email."
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(settings.SMTP_USER, settings.SMTP_PASS)
        smtp.send_message(message)


def send_family_welcome_email(
    to_email: str,
    *,
    first_name: str,
    phone: str,
    senior_name: str,
) -> None:
    if not smtp_configured():
        raise RuntimeError("SMTP is not configured")

    message = EmailMessage()
    message["Subject"] = "You're invited to EldCare"
    message["From"] = settings.SMTP_FROM or settings.SMTP_USER
    message["To"] = to_email
    message.set_content(
        f"Hi {first_name},\n\n"
        f"{senior_name} added you as family on EldCare.\n\n"
        f"Sign in with your email ({to_email}) or mobile ({phone}).\n"
        f"Your temporary password is your mobile number: {phone}\n\n"
        "You can change it anytime with Forgot password after signing in.\n\n"
        "— EldCare"
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(settings.SMTP_USER, settings.SMTP_PASS)
        smtp.send_message(message)
