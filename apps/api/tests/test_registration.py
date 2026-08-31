"""Backend tests for public registration, family access, and care approval."""

from __future__ import annotations

import uuid
from datetime import date, datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


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


@pytest.mark.asyncio
async def test_senior_registration_creates_profile_and_logs_in(client):
    email = unique_email("senior")
    phone = unique_phone()
    response = await client.post(
        "/api/v1/auth/register/senior",
        json={
            "first_name": "Lakshmi",
            "last_name": "Sharma",
            "email": email,
            "phone": phone,
            "password": PASSWORD,
            "date_of_birth": "1952-03-10",
            "address": "Borivali West",
            "emergency_contact": "9876543210",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["role"] == "SENIOR"
    assert body["account_status"] == "ACTIVE"
    assert body["access_token"]

    me = await client.get("/api/v1/users/me", headers=auth_header(body["access_token"]))
    assert me.status_code == 200
    assert me.json()["email"] == email

    profile = await client.get("/api/v1/seniors/me", headers=auth_header(body["access_token"]))
    assert profile.status_code == 200
    assert profile.json()["first_name"] == "Lakshmi"


@pytest.mark.asyncio
async def test_family_registration_does_not_grant_senior_access(client):
    email = unique_email("family")
    response = await client.post(
        "/api/v1/auth/register/family",
        json={
            "first_name": "Rahul",
            "last_name": "Sharma",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "relationship": "Son",
            "requested_senior_reference": "John Doe Borivali",
        },
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    seniors = await client.get("/api/v1/families/seniors", headers=auth_header(token))
    assert seniors.status_code == 200
    assert seniors.json() == []

    me = await client.get("/api/v1/families/me", headers=auth_header(token))
    assert me.status_code == 200
    assert me.json()["relationship"] == "Son"
    assert me.json()["requested_senior_reference"] == "John Doe Borivali"


@pytest.mark.asyncio
async def test_care_associate_application_is_pending(client):
    email = unique_email("care")
    response = await client.post(
        "/api/v1/auth/register/care-associate",
        json={
            "first_name": "Priya",
            "last_name": "Nair",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "skills": "Companionship",
            "experience": "3 years",
            "languages": "English, Hindi",
            "availability": "Weekdays",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["role"] == "CARE_MANAGER"
    assert body["care_status"] == "PENDING"

    token = body["access_token"]
    profile = await client.get("/api/v1/care/", headers=auth_header(token))
    assert profile.status_code == 200
    rows = profile.json()
    assert len(rows) == 1
    assert rows[0]["status"] == "PENDING"
    assert rows[0]["skills"] == "Companionship"


@pytest.mark.asyncio
async def test_registration_rejects_duplicate_email(client):
    email = unique_email("dup")
    phone1 = unique_phone()
    first = await client.post(
        "/api/v1/auth/register/senior",
        json={
            "first_name": "A",
            "last_name": "B",
            "email": email,
            "phone": phone1,
            "password": PASSWORD,
            "date_of_birth": "1950-01-01",
            "address": "Mumbai",
            "emergency_contact": "111",
        },
    )
    assert first.status_code == 200, first.text
    second = await client.post(
        "/api/v1/auth/register/family",
        json={
            "first_name": "C",
            "last_name": "D",
            "email": email,
            "phone": unique_phone(),
            "password": "different-password-123",
            "relationship": "Daughter",
        },
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_admin_can_create_family_profile_and_grant_access(client):
    admin = await login(client, "admin@example.com")
    # Create FAMILY user + profile via staff APIs
    email = unique_email("stafffamily")
    phone = unique_phone()
    user = await client.post(
        "/api/v1/users/",
        headers=auth_header(admin),
        json={"email": email, "phone": phone, "role": "FAMILY", "password": PASSWORD},
    )
    assert user.status_code == 200, user.text
    user_id = user.json()["id"]

    family = await client.post(
        "/api/v1/families/",
        headers=auth_header(admin),
        json={"user_id": user_id, "first_name": "Neha", "last_name": "Shah", "relationship": "Daughter"},
    )
    assert family.status_code == 200, family.text
    family_id = family.json()["id"]

    seniors = await client.get("/api/v1/seniors/", headers=auth_header(admin))
    assert seniors.status_code == 200
    senior_id = seniors.json()["items"][0]["id"]

    grant = await client.post(
        "/api/v1/access/",
        headers=auth_header(admin),
        json={"family_id": family_id, "senior_id": senior_id},
    )
    assert grant.status_code == 200, grant.text

    family_token = await login(client, email)
    authorized = await client.get("/api/v1/families/seniors", headers=auth_header(family_token))
    assert authorized.status_code == 200
    assert any(item["id"] == senior_id for item in authorized.json())

    revoke = await client.delete(f"/api/v1/access/{grant.json()['id']}", headers=auth_header(admin))
    assert revoke.status_code == 200
    after = await client.get("/api/v1/families/seniors", headers=auth_header(family_token))
    assert after.json() == []


@pytest.mark.asyncio
async def test_admin_approves_care_associate_before_visit_assignment(client):
    admin = await login(client, "admin@example.com")
    email = unique_email("applicant")
    apply = await client.post(
        "/api/v1/auth/register/care-associate",
        json={
            "first_name": "Asha",
            "last_name": "Patel",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "skills": "Home visits",
        },
    )
    assert apply.status_code == 200, apply.text
    care_token = apply.json()["access_token"]
    care_list = await client.get("/api/v1/care/", headers=auth_header(care_token))
    care_id = care_list.json()[0]["id"]

    seniors = await client.get("/api/v1/seniors/", headers=auth_header(admin))
    senior_id = seniors.json()["items"][0]["id"]

    denied = await client.post(
        "/api/v1/visits/",
        headers=auth_header(admin),
        json={
            "senior_id": senior_id,
            "care_manager_id": care_id,
            "scheduled_at": datetime.utcnow().isoformat(),
            "notes": "Should fail while pending",
        },
    )
    assert denied.status_code == 400, denied.text

    approved = await client.post(
        f"/api/v1/care/{care_id}/approve",
        headers=auth_header(admin),
        json={"status": "ACTIVE"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "ACTIVE"

    allowed = await client.post(
        "/api/v1/visits/",
        headers=auth_header(admin),
        json={
            "senior_id": senior_id,
            "care_manager_id": care_id,
            "scheduled_at": datetime.utcnow().isoformat(),
            "notes": "Approved associate",
        },
    )
    assert allowed.status_code == 200, allowed.text


@pytest.mark.asyncio
async def test_staff_user_create_still_allows_admin_role(client):
    admin = await login(client, "admin@example.com")
    email = unique_email("ops")
    created = await client.post(
        "/api/v1/users/",
        headers=auth_header(admin),
        json={
            "email": email,
            "phone": unique_phone(),
            "role": "OPERATIONS",
            "password": PASSWORD,
        },
    )
    assert created.status_code == 200, created.text
    assert created.json()["role"] == "OPERATIONS"
    assert created.json()["account_status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_duplicate_senior_profile_prevented(client):
    admin = await login(client, "admin@example.com")
    email = unique_email("sen2")
    user = await client.post(
        "/api/v1/users/",
        headers=auth_header(admin),
        json={"email": email, "phone": unique_phone(), "role": "SENIOR", "password": PASSWORD},
    )
    user_id = user.json()["id"]
    first = await client.post(
        "/api/v1/seniors/",
        headers=auth_header(admin),
        json={
            "user_id": user_id,
            "first_name": "One",
            "last_name": "Person",
            "date_of_birth": "1948-01-01",
            "address": "Mumbai",
            "emergency_contact": "100",
        },
    )
    assert first.status_code == 200, first.text
    second = await client.post(
        "/api/v1/seniors/",
        headers=auth_header(admin),
        json={
            "user_id": user_id,
            "first_name": "Two",
            "last_name": "Person",
            "date_of_birth": "1948-01-01",
            "address": "Mumbai",
            "emergency_contact": "100",
        },
    )
    assert second.status_code == 409
