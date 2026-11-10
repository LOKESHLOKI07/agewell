"""Bulk temporary/permanent caseload transfer for care managers and companions."""

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


async def register_senior(client: AsyncClient) -> tuple[dict, dict]:
    email = unique_email("caseload-senior")
    response = await client.post(
        "/api/v1/auth/register/senior",
        json={
            "first_name": "Caseload",
            "last_name": "Senior",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "date_of_birth": "1950-01-01",
            "address": "Borivali West",
            "emergency_contact": "9876543210",
        },
    )
    assert response.status_code == 200, response.text
    senior_headers = auth_header(response.json()["access_token"])
    me = await client.get("/api/v1/seniors/me", headers=senior_headers)
    assert me.status_code == 200, me.text
    return senior_headers, me.json()


async def provision_staff(client: AsyncClient, admin: dict, staff_kind: str) -> dict:
    created = await client.post(
        "/api/v1/care/provision",
        headers=admin,
        json={
            "email": unique_email(staff_kind.lower()),
            "phone": unique_phone(),
            "password": PASSWORD,
            "first_name": staff_kind.title(),
            "last_name": "Cover",
            "employee_id": f"{staff_kind[:2]}-{uuid.uuid4().hex[:6].upper()}",
            "staff_kind": staff_kind,
            "status": "ACTIVE",
        },
    )
    assert created.status_code == 200, created.text
    return created.json()


@pytest.mark.asyncio
async def test_temporary_care_manager_caseload_transfer_and_restore(client):
    admin = auth_header(await login(client, ADMIN_EMAIL))
    _senior_headers, senior = await register_senior(client)
    source = await provision_staff(client, admin, "CARE_MANAGER")
    substitute = await provision_staff(client, admin, "CARE_MANAGER")

    assigned = await client.patch(
        f"/api/v1/seniors/{senior['id']}",
        headers=admin,
        json={"care_manager_id": source["id"]},
    )
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["care_manager_id"] == source["id"]

    visit = await client.post(
        "/api/v1/visits/",
        headers=admin,
        json={
            "senior_id": senior["id"],
            "care_manager_id": source["id"],
            "status": "SCHEDULED",
            "notes": "Leave cover test",
        },
    )
    assert visit.status_code == 200, visit.text
    visit_id = visit.json()["id"]

    preview = await client.get(f"/api/v1/care/{source['id']}/caseload", headers=admin)
    assert preview.status_code == 200
    assert preview.json()["standing_senior_count"] >= 1
    assert preview.json()["transfer_supported"] is True

    transferred = await client.post(
        f"/api/v1/care/{source['id']}/transfer-caseload",
        headers=admin,
        json={"substitute_id": substitute["id"], "mode": "TEMPORARY", "transfer_visits": True},
    )
    assert transferred.status_code == 200, transferred.text
    body = transferred.json()
    assert body["seniors_moved"] >= 1
    assert body["mode"] == "TEMPORARY"

    senior_after = (await client.get(f"/api/v1/seniors/{senior['id']}", headers=admin)).json()
    assert senior_after["care_manager_id"] == substitute["id"]
    assert senior_after["care_manager_primary_id"] == source["id"]

    source_after = (await client.get(f"/api/v1/care/{source['id']}", headers=admin)).json()
    assert source_after["status"] == "ON_LEAVE"

    visit_after = (await client.get(f"/api/v1/visits/{visit_id}", headers=admin)).json()
    assert visit_after["care_manager_id"] == substitute["id"]

    restored = await client.post(f"/api/v1/care/{source['id']}/restore-caseload", headers=admin)
    assert restored.status_code == 200, restored.text
    assert restored.json()["seniors_restored"] >= 1

    senior_restored = (await client.get(f"/api/v1/seniors/{senior['id']}", headers=admin)).json()
    assert senior_restored["care_manager_id"] == source["id"]
    assert senior_restored["care_manager_primary_id"] is None

    source_restored = (await client.get(f"/api/v1/care/{source['id']}", headers=admin)).json()
    assert source_restored["status"] == "ACTIVE"

    visit_restored = (await client.get(f"/api/v1/visits/{visit_id}", headers=admin)).json()
    assert visit_restored["care_manager_id"] == source["id"]


@pytest.mark.asyncio
async def test_permanent_companion_caseload_transfer(client):
    admin = auth_header(await login(client, ADMIN_EMAIL))
    _senior_headers, senior = await register_senior(client)
    source = await provision_staff(client, admin, "COMPANION")
    substitute = await provision_staff(client, admin, "COMPANION")

    assigned = await client.patch(
        f"/api/v1/seniors/{senior['id']}",
        headers=admin,
        json={"companion_id": source["id"]},
    )
    assert assigned.status_code == 200, assigned.text

    transferred = await client.post(
        f"/api/v1/care/{source['id']}/transfer-caseload",
        headers=admin,
        json={"substitute_id": substitute["id"], "mode": "PERMANENT", "transfer_visits": False},
    )
    assert transferred.status_code == 200, transferred.text

    senior_after = (await client.get(f"/api/v1/seniors/{senior['id']}", headers=admin)).json()
    assert senior_after["companion_id"] == substitute["id"]
    assert senior_after.get("companion_primary_id") in (None, "")

    source_after = (await client.get(f"/api/v1/care/{source['id']}", headers=admin)).json()
    assert source_after["status"] != "ON_LEAVE"

    restore = await client.post(f"/api/v1/care/{source['id']}/restore-caseload", headers=admin)
    assert restore.status_code == 400
