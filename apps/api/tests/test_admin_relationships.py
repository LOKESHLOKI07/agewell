"""Admin relationship and profile-management coverage."""

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

ADMIN_EMAIL = "admin@example.com"
SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
FAMILY_EMAIL = "family@example.com"
CARE_EMAIL = "care@example.com"
PASSWORD = "password123"


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_admin_can_edit_senior_profile(client):
    admin = await login(client, ADMIN_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    admin_h = auth_header(admin)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()

    detail = await client.get(f"/api/v1/seniors/{me['id']}", headers=admin_h)
    assert detail.status_code == 200
    assert detail.json().get("email")

    patched = await client.patch(
        f"/api/v1/seniors/{me['id']}",
        headers=admin_h,
        json={
            "address": "Updated Admin Address",
            "emergency_contact": "999",
            "date_of_birth": "1952-03-10",
        },
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["address"] == "Updated Admin Address"
    assert patched.json()["emergency_contact"] == "999"
    assert patched.json()["date_of_birth"] == "1952-03-10"
    assert patched.json().get("email")

    forbidden = await client.patch(
        f"/api/v1/seniors/{me['id']}",
        headers=auth_header(senior),
        json={"address": "Nope"},
    )
    assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_admin_family_update_and_access_enrichment(client):
    admin = await login(client, ADMIN_EMAIL)
    family = await login(client, FAMILY_EMAIL)
    senior = await login(client, SENIOR2_EMAIL)
    admin_h = auth_header(admin)

    families = (await client.get("/api/v1/families/", headers=admin_h)).json()["items"]
    family_id = families[0]["id"]
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()

    updated = await client.patch(
        f"/api/v1/families/{family_id}",
        headers=admin_h,
        json={"relationship": "Daughter"},
    )
    assert updated.status_code == 200
    assert updated.json()["relationship"] == "Daughter"

    created = await client.post(
        "/api/v1/access/",
        headers=admin_h,
        json={"family_id": family_id, "senior_id": jane["id"]},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body.get("family_name") or body.get("senior_name")
    access_id = body["id"]

    listed = await client.get(
        "/api/v1/access/",
        headers=admin_h,
        params={"family_id": family_id, "senior_id": jane["id"]},
    )
    assert listed.status_code == 200
    item = listed.json()["items"][0]
    assert item["family_id"] == family_id
    assert item["senior_id"] == jane["id"]
    assert item.get("senior_name") or item.get("family_name")

    non_staff = await client.post(
        "/api/v1/access/",
        headers=auth_header(family),
        json={"family_id": family_id, "senior_id": jane["id"]},
    )
    assert non_staff.status_code == 403

    await client.delete(f"/api/v1/access/{access_id}", headers=admin_h)


@pytest.mark.asyncio
async def test_duplicate_access_and_unknown_profile(client):
    admin = await login(client, ADMIN_EMAIL)
    admin_h = auth_header(admin)
    families = (await client.get("/api/v1/families/", headers=admin_h)).json()["items"]
    seniors = (await client.get("/api/v1/seniors/", headers=admin_h)).json()["items"]
    family_id = families[0]["id"]
    senior_id = seniors[0]["id"]

    first = await client.post(
        "/api/v1/access/",
        headers=admin_h,
        json={"family_id": family_id, "senior_id": senior_id},
    )
    assert first.status_code in (200, 409)
    if first.status_code == 200:
        second = await client.post(
            "/api/v1/access/",
            headers=admin_h,
            json={"family_id": family_id, "senior_id": senior_id},
        )
        assert second.status_code == 409
        await client.delete(f"/api/v1/access/{first.json()['id']}", headers=admin_h)

    missing = await client.get(
        f"/api/v1/seniors/{uuid.uuid4()}",
        headers=admin_h,
    )
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_visit_care_manager_filter_and_assignment(client):
    admin = await login(client, ADMIN_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    admin_h = auth_header(admin)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    managers = (await client.get("/api/v1/care/", headers=admin_h)).json()
    active = next((m for m in managers if (m.get("status") or "").upper() == "ACTIVE"), managers[0])

    created = await client.post(
        "/api/v1/visits/",
        headers=admin_h,
        json={
            "senior_id": john["id"],
            "care_manager_id": active["id"],
            "status": "SCHEDULED",
            "notes": "Admin relationship visit",
        },
    )
    assert created.status_code == 200, created.text
    visit_id = created.json()["id"]
    assert created.json()["care_manager_id"] == active["id"]

    filtered = await client.get(
        "/api/v1/visits/",
        headers=admin_h,
        params={"care_manager_id": active["id"], "senior_id": john["id"]},
    )
    assert filtered.status_code == 200
    assert any(item["id"] == visit_id for item in filtered.json()["items"])

    patched = await client.patch(
        f"/api/v1/visits/{visit_id}",
        headers=admin_h,
        json={"notes": "Reassigned note"},
    )
    assert patched.status_code == 200
    assert patched.json()["notes"] == "Reassigned note"

    family = await login(client, FAMILY_EMAIL)
    forbidden = await client.post(
        "/api/v1/visits/",
        headers=auth_header(family),
        json={"senior_id": john["id"], "care_manager_id": active["id"]},
    )
    assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_role_change_rejected(client):
    admin = await login(client, ADMIN_EMAIL)
    admin_h = auth_header(admin)
    users = (await client.get("/api/v1/users/", headers=admin_h, params={"role": "SENIOR"})).json()["items"]
    user = users[0]
    response = await client.patch(
        f"/api/v1/users/{user['id']}",
        headers=admin_h,
        json={"role": "FAMILY"},
    )
    assert response.status_code == 400
    assert "Role changes are disabled" in response.json()["detail"]


@pytest.mark.asyncio
async def test_care_associate_update(client):
    admin = await login(client, ADMIN_EMAIL)
    admin_h = auth_header(admin)
    managers = (await client.get("/api/v1/care/", headers=admin_h)).json()
    cm = managers[0]
    patched = await client.patch(
        f"/api/v1/care/{cm['id']}",
        headers=admin_h,
        json={"skills": "Companionship, mobility"},
    )
    assert patched.status_code == 200
    assert "Companionship" in (patched.json().get("skills") or "")


@pytest.mark.asyncio
async def test_admin_can_delete_people_records(client):
    admin = await login(client, ADMIN_EMAIL)
    admin_h = auth_header(admin)
    suffix = uuid.uuid4().hex[:8]

    me = (await client.get("/api/v1/users/me", headers=admin_h)).json()
    blocked = await client.delete(f"/api/v1/users/{me['id']}", headers=admin_h)
    assert blocked.status_code == 400
    assert "own account" in blocked.json()["detail"]

    family_user = await client.post(
        "/api/v1/users/",
        headers=admin_h,
        json={
            "email": f"del-family-{suffix}@example.com",
            "phone": f"70{suffix}",
            "role": "FAMILY",
            "password": "password123",
        },
    )
    assert family_user.status_code == 200, family_user.text
    family_user_id = family_user.json()["id"]
    family = await client.post(
        "/api/v1/families/",
        headers=admin_h,
        json={
            "user_id": family_user_id,
            "first_name": "Del",
            "last_name": "Family",
            "relationship": "Son",
        },
    )
    assert family.status_code == 200, family.text
    family_id = family.json()["id"]
    deleted_family = await client.delete(f"/api/v1/families/{family_id}", headers=admin_h)
    assert deleted_family.status_code == 200, deleted_family.text
    assert (await client.get(f"/api/v1/families/{family_id}", headers=admin_h)).status_code == 404
    assert (await client.get(f"/api/v1/users/{family_user_id}", headers=admin_h)).status_code == 404

    senior_user = await client.post(
        "/api/v1/users/",
        headers=admin_h,
        json={
            "email": f"del-senior-{suffix}@example.com",
            "phone": f"71{suffix}",
            "role": "SENIOR",
            "password": "password123",
        },
    )
    assert senior_user.status_code == 200, senior_user.text
    senior_user_id = senior_user.json()["id"]
    senior = await client.post(
        "/api/v1/seniors/",
        headers=admin_h,
        json={
            "user_id": senior_user_id,
            "first_name": "Del",
            "last_name": "Senior",
            "date_of_birth": "1940-01-01",
            "address": "Home",
            "emergency_contact": "911",
        },
    )
    assert senior.status_code == 200, senior.text
    senior_id = senior.json()["id"]
    deleted_senior = await client.delete(f"/api/v1/seniors/{senior_id}", headers=admin_h)
    assert deleted_senior.status_code == 200, deleted_senior.text
    assert (await client.get(f"/api/v1/seniors/{senior_id}", headers=admin_h)).status_code == 404
    assert (await client.get(f"/api/v1/users/{senior_user_id}", headers=admin_h)).status_code == 404

    care_user = await client.post(
        "/api/v1/users/",
        headers=admin_h,
        json={
            "email": f"del-care-{suffix}@example.com",
            "phone": f"72{suffix}",
            "role": "CARE_MANAGER",
            "password": "password123",
        },
    )
    assert care_user.status_code == 200, care_user.text
    care_user_id = care_user.json()["id"]
    care = await client.post(
        "/api/v1/care/",
        headers=admin_h,
        json={
            "user_id": care_user_id,
            "employee_id": f"DEL-{suffix}",
            "first_name": "Del",
            "last_name": "Care",
            "skills": "Nursing",
            "status": "ACTIVE",
        },
    )
    assert care.status_code == 200, care.text
    care_id = care.json()["id"]
    deleted_care = await client.delete(f"/api/v1/care/{care_id}", headers=admin_h)
    assert deleted_care.status_code == 200, deleted_care.text
    assert (await client.get(f"/api/v1/care/{care_id}", headers=admin_h)).status_code == 404
    assert (await client.get(f"/api/v1/users/{care_user_id}", headers=admin_h)).status_code == 404

    lone = await client.post(
        "/api/v1/users/",
        headers=admin_h,
        json={
            "email": f"del-ops-{suffix}@example.com",
            "phone": f"73{suffix}",
            "role": "OPERATIONS",
            "password": "password123",
        },
    )
    assert lone.status_code == 200, lone.text
    lone_id = lone.json()["id"]
    deleted_user = await client.delete(f"/api/v1/users/{lone_id}", headers=admin_h)
    assert deleted_user.status_code == 200, deleted_user.text
    assert (await client.get(f"/api/v1/users/{lone_id}", headers=admin_h)).status_code == 404
