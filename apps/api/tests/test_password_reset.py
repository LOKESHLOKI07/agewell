from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.modules.auth.otp_service import create_otp_session_token, create_password_reset_token

PASSWORD = "password123"
NEW_PASSWORD = "newpass12"


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


def unique_email(prefix: str) -> str:
    return f"{prefix}.{uuid.uuid4().hex[:10]}@example.com"


def unique_phone() -> str:
    return f"9{uuid.uuid4().int % 10**9:09d}"


async def register_senior(client: AsyncClient, email: str) -> None:
    response = await client.post(
        "/api/v1/auth/register/senior",
        json={
            "first_name": "Lakshmi",
            "last_name": "Sharma",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "date_of_birth": "1952-03-10",
            "address": "Borivali West",
            "emergency_contact": "9876543210",
        },
    )
    assert response.status_code == 200, response.text


@pytest.mark.asyncio
async def test_password_reset_updates_login(client, monkeypatch):
    monkeypatch.setattr("app.modules.auth.router.smtp_configured", lambda: True)
    monkeypatch.setattr("app.modules.auth.router.send_otp_email", lambda *args, **kwargs: None)
    monkeypatch.setattr("app.modules.auth.router.generate_otp_code", lambda: "123456")

    email = unique_email("reset")
    await register_senior(client, email)

    forgot = await client.post("/api/v1/auth/password/forgot", json={"email": email})
    assert forgot.status_code == 200, forgot.text

    verify = await client.post(
        "/api/v1/auth/password/verify",
        json={"email": email, "code": "123456"},
    )
    assert verify.status_code == 200, verify.text
    reset_token = verify.json()["reset_token"]
    assert reset_token

    reset = await client.post(
        "/api/v1/auth/password/reset",
        json={"reset_token": reset_token, "password": NEW_PASSWORD},
    )
    assert reset.status_code == 200, reset.text

    old_login = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": NEW_PASSWORD},
    )
    assert new_login.status_code == 200, new_login.text
    assert new_login.json()["access_token"]


@pytest.mark.asyncio
async def test_password_forgot_unknown_email_does_not_reveal_account(client, monkeypatch):
    monkeypatch.setattr("app.modules.auth.router.smtp_configured", lambda: True)
    sent = {"count": 0}

    def fake_send(*args, **kwargs):
        sent["count"] += 1

    monkeypatch.setattr("app.modules.auth.router.send_otp_email", fake_send)

    response = await client.post(
        "/api/v1/auth/password/forgot",
        json={"email": unique_email("missing")},
    )
    assert response.status_code == 200
    assert "verification code" in response.json()["message"].lower()
    assert sent["count"] == 0


@pytest.mark.asyncio
async def test_password_verify_rejects_wrong_code(client, monkeypatch):
    monkeypatch.setattr("app.modules.auth.router.smtp_configured", lambda: True)
    monkeypatch.setattr("app.modules.auth.router.send_otp_email", lambda *args, **kwargs: None)
    monkeypatch.setattr("app.modules.auth.router.generate_otp_code", lambda: "123456")

    email = unique_email("badcode")
    await register_senior(client, email)
    await client.post("/api/v1/auth/password/forgot", json={"email": email})

    response = await client.post(
        "/api/v1/auth/password/verify",
        json={"email": email, "code": "000000"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_password_reset_rejects_signup_identity_token(client):
    email = unique_email("identity")
    await register_senior(client, email)
    token = create_otp_session_token(email)

    response = await client.post(
        "/api/v1/auth/password/reset",
        json={"reset_token": token, "password": NEW_PASSWORD},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_password_reset_token_roundtrip_is_purpose_scoped():
    email = "member@example.com"
    reset_token = create_password_reset_token(email)
    signup_token = create_otp_session_token(email)

    from app.modules.auth.otp_service import read_password_reset_email, read_verified_email

    assert read_password_reset_email(reset_token) == email
    assert read_verified_email(reset_token) is None
    assert read_password_reset_email(signup_token) is None
    assert read_verified_email(signup_token) == email
