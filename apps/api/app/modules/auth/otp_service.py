import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from jwt import PyJWTError
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import ALGORITHM

OTP_TTL = timedelta(minutes=10)
OTP_SESSION_TTL = timedelta(hours=2)
PASSWORD_RESET_TTL = timedelta(minutes=15)
RESEND_COOLDOWN = timedelta(seconds=45)
MAX_ATTEMPTS = 5

_otp_store: dict[str, dict] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_otp(email: str, code: str) -> str:
    payload = f"{email}:{code}:{settings.JWT_SECRET}".encode()
    return hashlib.sha256(payload).hexdigest()


def generate_otp_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def can_send_otp(email: str) -> None:
    row = _otp_store.get(email)
    if not row:
        return
    sent_at = row.get("sent_at")
    if sent_at and _now() - sent_at < RESEND_COOLDOWN:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait a moment before requesting another code.",
        )


def store_otp(email: str, code: str) -> None:
    _otp_store[email] = {
        "hash": _hash_otp(email, code),
        "expires_at": _now() + OTP_TTL,
        "attempts": 0,
        "sent_at": _now(),
    }


def verify_stored_otp(email: str, code: str) -> None:
    row = _otp_store.get(email)
    if not row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request a new code first.")
    if _now() > row["expires_at"]:
        _otp_store.pop(email, None)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That code has expired. Request a new one.")
    row["attempts"] += 1
    if row["attempts"] > MAX_ATTEMPTS:
        _otp_store.pop(email, None)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many attempts. Request a new code.")
    expected = row["hash"]
    actual = _hash_otp(email, code.strip())
    if not hmac.compare_digest(expected, actual):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That code is incorrect.")
    _otp_store.pop(email, None)


def create_otp_session_token(email: str, purpose: str = "otp_verified") -> str:
    expire = _now() + OTP_SESSION_TTL
    return jwt.encode(
        {"exp": expire, "sub": email, "purpose": purpose},
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )


def read_verified_email(token: str | None) -> str | None:
    return _read_purpose_email(token, {"otp_verified", "google_verified"})


def create_password_reset_token(email: str) -> str:
    expire = _now() + PASSWORD_RESET_TTL
    return jwt.encode(
        {"exp": expire, "sub": email, "purpose": "password_reset"},
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )


def read_password_reset_email(token: str | None) -> str | None:
    return _read_purpose_email(token, {"password_reset"})


def _read_purpose_email(token: str | None, purposes: set[str]) -> str | None:
    if not token or not token.strip():
        return None
    try:
        payload = jwt.decode(token.strip(), settings.JWT_SECRET, algorithms=[ALGORITHM])
    except PyJWTError:
        return None
    if payload.get("purpose") not in purposes:
        return None
    email = (payload.get("sub") or "").strip().lower()
    return email or None
