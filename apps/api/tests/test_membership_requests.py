"""Family membership purchase request and admin approve/reject."""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def unique_email(prefix: str) -> str:
    return f"{prefix}.{uuid.uuid4().hex[:10]}@example.com"


def unique_phone() -> str:
    return f"9{uuid.uuid4().int % 10**9:09d}"


async def register_senior(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/register/senior",
        json={
            "first_name": "Purchase",
            "last_name": "Tester",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "date_of_birth": "1952-03-10",
            "address": "Borivali West",
            "emergency_contact": "9876543210",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_family_can_request_membership_and_admin_can_approve(client):
    email = unique_email("member")
    senior_token = await register_senior(client, email)
    senior = auth_header(senior_token)

    missing = await client.get("/api/v1/memberships/current", headers=senior)
    assert missing.status_code == 404

    created = await client.post(
        "/api/v1/memberships/requests",
        headers=senior,
        json={"plan_key": "basic"},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["status"] == "REQUESTED"
    assert body["plan_name"] == "Basic Membership"
    request_id = body["id"]

    duplicate = await client.post(
        "/api/v1/memberships/requests",
        headers=senior,
        json={"plan_key": "couple"},
    )
    assert duplicate.status_code == 409

    listed = await client.get("/api/v1/memberships/requests", headers=senior)
    assert listed.status_code == 200, listed.text
    assert listed.json()["total"] >= 1
    assert listed.json()["items"][0]["id"] == request_id

    admin = auth_header(await login(client, ADMIN_EMAIL))
    pending = await client.get(
        "/api/v1/memberships/requests",
        headers=admin,
        params={"status": "REQUESTED"},
    )
    assert pending.status_code == 200, pending.text
    assert any(item["id"] == request_id for item in pending.json()["items"])

    approved = await client.patch(
        f"/api/v1/memberships/requests/{request_id}",
        headers=admin,
        json={"status": "APPROVED"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "APPROVED"

    current = await client.get("/api/v1/memberships/current", headers=senior)
    assert current.status_code == 200, current.text
    assert current.json()["plan_name"] == "Basic Membership"
    assert current.json()["status"] == "ACTIVE"

    again = await client.post(
        "/api/v1/memberships/requests",
        headers=senior,
        json={"plan_key": "basic"},
    )
    assert again.status_code == 409


@pytest.mark.asyncio
async def test_admin_can_reject_membership_request(client):
    email = unique_email("reject")
    senior = auth_header(await register_senior(client, email))

    created = await client.post(
        "/api/v1/memberships/requests",
        headers=senior,
        json={"plan_key": "couple"},
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]
    assert created.json()["plan_name"] == "Couple Membership"

    admin = auth_header(await login(client, ADMIN_EMAIL))
    rejected = await client.patch(
        f"/api/v1/memberships/requests/{request_id}",
        headers=admin,
        json={"status": "REJECTED"},
    )
    assert rejected.status_code == 200, rejected.text
    assert rejected.json()["status"] == "REJECTED"

    current = await client.get("/api/v1/memberships/current", headers=senior)
    assert current.status_code == 404

    retry = await client.post(
        "/api/v1/memberships/requests",
        headers=senior,
        json={"plan_key": "couple"},
    )
    assert retry.status_code == 200, retry.text
    assert retry.json()["status"] == "REQUESTED"
