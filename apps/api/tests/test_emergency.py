"""Phase 4.6B emergency case and event API."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.modules.emergency.repository import CREATED_EVENT_DESCRIPTION

SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
FAMILY_EMAIL = "family@example.com"
FAMILY2_EMAIL = "family2@example.com"
CARE_EMAIL = "care@example.com"
ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"
MISSING_ID = "00000000-0000-0000-0000-000000000001"


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


async def john_case(client: AsyncClient) -> dict:
    token = await login(client, SENIOR_EMAIL)
    listed = await client.get("/api/v1/emergency/", headers=auth_header(token))
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
    medical = next(item for item in listed.json()["items"] if item["type"] == "MEDICAL")
    return medical


@pytest.mark.asyncio
async def test_senior_own_cases(client):
    token = await login(client, SENIOR_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(token))).json()
    response = await client.get("/api/v1/emergency/", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert "items" in payload
    assert all(item["senior_id"] == me["id"] for item in payload["items"])
    medical = next(item for item in payload["items"] if item["type"] == "MEDICAL")
    assert medical["status"] == "OPEN"
    assert set(medical.keys()) == {"id", "senior_id", "type", "status", "created_at"}


@pytest.mark.asyncio
async def test_senior_cross_senior_list_forbidden(client):
    owner = await login(client, SENIOR_EMAIL)
    other = await login(client, SENIOR2_EMAIL)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(owner))).json()
    response = await client.get(
        "/api/v1/emergency/",
        headers=auth_header(other),
        params={"senior_id": john["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_senior_own_case_detail(client):
    token = await login(client, SENIOR_EMAIL)
    case = await john_case(client)
    response = await client.get(f"/api/v1/emergency/{case['id']}", headers=auth_header(token))
    assert response.status_code == 200
    assert response.json()["id"] == case["id"]
    assert response.json()["type"] == "MEDICAL"


@pytest.mark.asyncio
async def test_senior_cross_senior_detail_forbidden(client):
    other = await login(client, SENIOR2_EMAIL)
    case = await john_case(client)
    response = await client.get(f"/api/v1/emergency/{case['id']}", headers=auth_header(other))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_senior_own_events(client):
    token = await login(client, SENIOR_EMAIL)
    case = await john_case(client)
    response = await client.get(f"/api/v1/emergency/{case['id']}/events", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    event = payload["items"][0]
    assert event["case_id"] == case["id"]
    assert event["event_description"] == CREATED_EVENT_DESCRIPTION
    assert set(event.keys()) == {"id", "case_id", "event_description", "created_at"}
    assert "Ambulance" not in event["event_description"]


@pytest.mark.asyncio
async def test_senior_cross_senior_events_forbidden(client):
    other = await login(client, SENIOR2_EMAIL)
    case = await john_case(client)
    response = await client.get(f"/api/v1/emergency/{case['id']}/events", headers=auth_header(other))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_family_authorized_senior(client):
    family = await login(client, FAMILY_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    listed = await client.get(
        "/api/v1/emergency/",
        headers=auth_header(family),
        params={"senior_id": john["id"]},
    )
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
    case_id = listed.json()["items"][0]["id"]
    detail = await client.get(f"/api/v1/emergency/{case_id}", headers=auth_header(family))
    events = await client.get(f"/api/v1/emergency/{case_id}/events", headers=auth_header(family))
    assert detail.status_code == 200
    assert events.status_code == 200


@pytest.mark.asyncio
async def test_family_unauthorized_senior(client):
    family = await login(client, FAMILY_EMAIL)
    family2 = await login(client, FAMILY2_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(senior2))).json()
    case = await john_case(client)

    assert (
        await client.get(
            "/api/v1/emergency/",
            headers=auth_header(family),
            params={"senior_id": jane["id"]},
        )
    ).status_code == 403
    assert (
        await client.get(
            "/api/v1/emergency/",
            headers=auth_header(family2),
            params={"senior_id": john["id"]},
        )
    ).status_code == 403
    assert (await client.get(f"/api/v1/emergency/{case['id']}", headers=auth_header(family2))).status_code == 403


@pytest.mark.asyncio
async def test_care_manager_assigned_senior(client):
    care = await login(client, CARE_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    listed = await client.get(
        "/api/v1/emergency/",
        headers=auth_header(care),
        params={"senior_id": john["id"]},
    )
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
    assert all(item["senior_id"] == john["id"] for item in listed.json()["items"])
    unscoped = await client.get("/api/v1/emergency/", headers=auth_header(care))
    assert unscoped.status_code == 200
    assert unscoped.json()["total"] >= 1


@pytest.mark.asyncio
async def test_care_manager_unassigned_senior(client):
    care = await login(client, CARE_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(senior2))).json()
    listed = await client.get(
        "/api/v1/emergency/",
        headers=auth_header(care),
        params={"senior_id": jane["id"]},
    )
    assert listed.status_code == 403
    created = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(care),
        json={"type": "MEDICAL", "senior_id": str(jane["id"])},
    )
    assert created.status_code == 403


@pytest.mark.asyncio
async def test_admin_access(client):
    admin = await login(client, ADMIN_EMAIL)
    listed = await client.get("/api/v1/emergency/", headers=auth_header(admin))
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
    case_id = listed.json()["items"][0]["id"]
    detail = await client.get(f"/api/v1/emergency/{case_id}", headers=auth_header(admin))
    events = await client.get(f"/api/v1/emergency/{case_id}/events", headers=auth_header(admin))
    assert detail.status_code == 200
    assert events.status_code == 200


@pytest.mark.asyncio
async def test_emergency_requires_auth(client):
    case = await john_case(client)
    assert (await client.get("/api/v1/emergency/")).status_code == 401
    assert (await client.get(f"/api/v1/emergency/{case['id']}")).status_code == 401
    assert (await client.get(f"/api/v1/emergency/{case['id']}/events")).status_code == 401
    assert (await client.post("/api/v1/emergency/", json={"type": "MEDICAL"})).status_code == 401


@pytest.mark.asyncio
async def test_unknown_emergency_case(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)
    assert (await client.get(f"/api/v1/emergency/{MISSING_ID}", headers=headers)).status_code == 404
    assert (await client.get(f"/api/v1/emergency/{MISSING_ID}/events", headers=headers)).status_code == 404


@pytest.mark.asyncio
async def test_create_own_emergency(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)
    me = (await client.get("/api/v1/seniors/me", headers=headers)).json()
    created = await client.post("/api/v1/emergency/", headers=headers, json={"type": "HOSPITAL"})
    assert created.status_code == 200
    body = created.json()
    assert body["senior_id"] == me["id"]
    assert body["type"] == "HOSPITAL"
    assert body["status"] == "OPEN"
    events = await client.get(f"/api/v1/emergency/{body['id']}/events", headers=headers)
    assert events.status_code == 200
    assert events.json()["items"][0]["event_description"] == CREATED_EVENT_DESCRIPTION


@pytest.mark.asyncio
async def test_create_unauthorized_senior_emergency(client):
    owner = await login(client, SENIOR_EMAIL)
    other = await login(client, SENIOR2_EMAIL)
    family2 = await login(client, FAMILY2_EMAIL)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(owner))).json()
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(other))).json()

    as_john = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(owner),
        json={"type": "MEDICAL", "senior_id": str(jane["id"])},
    )
    assert as_john.status_code == 403

    as_family2 = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(family2),
        json={"type": "MEDICAL", "senior_id": str(john["id"])},
    )
    assert as_family2.status_code == 403


@pytest.mark.asyncio
async def test_emergency_openapi_real_schemas(client):
    spec = (await client.get("/openapi.json")).json()
    schemas = spec["components"]["schemas"]
    assert "EmergencyResponse" not in schemas
    assert set(schemas["EmergencyCaseResponse"]["properties"].keys()) == {
        "id",
        "senior_id",
        "type",
        "status",
        "created_at",
    }
    assert set(schemas["EmergencyEventResponse"]["properties"].keys()) == {
        "id",
        "case_id",
        "event_description",
        "created_at",
    }
    assert "type" in schemas["EmergencyCreate"]["properties"]
    paths = spec["paths"]
    assert "get" in paths["/api/v1/emergency/"]
    assert "post" in paths["/api/v1/emergency/"]
    assert "/api/v1/emergency/{emergency_id}" in paths
    assert "/api/v1/emergency/{emergency_id}/events" in paths
    assert "securitySchemes" in spec.get("components", {})


@pytest.mark.asyncio
async def test_public_stub_is_gone(client):
    response = await client.get("/api/v1/emergency/")
    assert response.status_code == 401
    assert response.json() != []
