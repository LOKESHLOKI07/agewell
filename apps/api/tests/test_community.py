"""Phase 4.11B community events and registration contracts."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
FAMILY_EMAIL = "family@example.com"
FAMILY2_EMAIL = "family2@example.com"
CARE_EMAIL = "care@example.com"
ADMIN_EMAIL = "admin@example.com"
OPERATIONS_EMAIL = "operations@example.com"
PASSWORD = "password123"

EVENT_KEYS = {"id", "title", "description", "event_date", "capacity"}
REGISTRATION_KEYS = {"id", "event_id", "user_id", "status", "event_title"}
UNKNOWN_ID = "00000000-0000-0000-0000-000000000099"
EVENT_AT = "2026-10-01T10:00:00Z"


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def assert_event_shape(body: dict):
    assert set(body.keys()) == EVENT_KEYS
    assert "location" not in body
    assert "image_url" not in body
    assert "category" not in body
    assert "availability" not in body
    assert "registered" not in body
    assert "what_to_expect" not in body
    assert "transportation" not in body


def assert_registration_shape(body: dict):
    assert set(body.keys()) == REGISTRATION_KEYS
    assert body["status"] in {"REGISTERED", "CANCELLED"}
    assert "location" not in body
    assert "image_url" not in body


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def tokens(client):
    return {
        "senior": await login(client, SENIOR_EMAIL),
        "senior2": await login(client, SENIOR2_EMAIL),
        "family": await login(client, FAMILY_EMAIL),
        "family2": await login(client, FAMILY2_EMAIL),
        "care": await login(client, CARE_EMAIL),
        "admin": await login(client, ADMIN_EMAIL),
        "ops": await login(client, OPERATIONS_EMAIL),
    }


@pytest_asyncio.fixture
async def ids(client, tokens):
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(tokens["senior"]))).json()
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(tokens["senior2"]))).json()
    events = (await client.get("/api/v1/community/", headers=auth_header(tokens["senior"]))).json()
    bingo = next(item for item in events["items"] if item["title"] == "Bingo")
    return {
        "john": john["id"],
        "jane": jane["id"],
        "john_user": john["user_id"],
        "jane_user": jane["user_id"],
        "bingo": bingo["id"],
    }


@pytest.mark.asyncio
async def test_unauthenticated_community_requests_return_401(client, ids):
    assert (await client.get("/api/v1/community/")).status_code == 401
    assert (await client.get(f"/api/v1/community/{ids['bingo']}")).status_code == 401
    assert (await client.post("/api/v1/community/", json={"title": "X", "event_date": EVENT_AT})).status_code == 401
    assert (await client.post(f"/api/v1/community/{ids['bingo']}/register", json={})).status_code == 401
    assert (await client.get("/api/v1/community/registrations")).status_code == 401


@pytest.mark.asyncio
async def test_senior_and_family_can_list_and_open_events(client, tokens, ids):
    for role in ("senior", "family", "admin", "ops"):
        listed = await client.get("/api/v1/community/", headers=auth_header(tokens[role]))
        assert listed.status_code == 200, role
        body = listed.json()
        assert body["total"] >= 1
        titles = {item["title"] for item in body["items"]}
        assert "Bingo" in titles
        assert_event_shape(body["items"][0])
        detail = await client.get(f"/api/v1/community/{ids['bingo']}", headers=auth_header(tokens[role]))
        assert detail.status_code == 200, role
        assert_event_shape(detail.json())
        assert detail.json()["title"] == "Bingo"
        assert detail.json()["description"] == "Fun"
        assert detail.json()["capacity"] == 20


@pytest.mark.asyncio
async def test_care_manager_cannot_read_community(client, tokens, ids):
    headers = auth_header(tokens["care"])
    assert (await client.get("/api/v1/community/", headers=headers)).status_code == 403
    assert (await client.get(f"/api/v1/community/{ids['bingo']}", headers=headers)).status_code == 403
    assert (await client.get("/api/v1/community/registrations", headers=headers)).status_code == 403


@pytest.mark.asyncio
async def test_unknown_event_returns_404(client, tokens):
    response = await client.get(
        f"/api/v1/community/{UNKNOWN_ID}",
        headers=auth_header(tokens["senior"]),
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_non_staff_cannot_mutate_events(client, tokens, ids):
    payload = {"title": "Staff only", "description": "No", "event_date": EVENT_AT, "capacity": 5}
    for role in ("senior", "family", "care"):
        headers = auth_header(tokens[role])
        assert (await client.post("/api/v1/community/", headers=headers, json=payload)).status_code == 403, role
        assert (
            await client.patch(f"/api/v1/community/{ids['bingo']}", headers=headers, json={"title": "Nope"})
        ).status_code == 403, role
        assert (await client.delete(f"/api/v1/community/{ids['bingo']}", headers=headers)).status_code == 403, role


@pytest.mark.asyncio
async def test_admin_and_operations_can_create_update_delete_events(client, tokens):
    headers = auth_header(tokens["admin"])
    created = await client.post(
        "/api/v1/community/",
        headers=headers,
        json={"title": "Tea morning", "description": "Social tea", "event_date": EVENT_AT, "capacity": 8},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert_event_shape(body)
    assert body["title"] == "Tea morning"
    event_id = body["id"]

    patched = await client.patch(
        f"/api/v1/community/{event_id}",
        headers=headers,
        json={"title": "Tea afternoon", "capacity": 12},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Tea afternoon"
    assert patched.json()["capacity"] == 12
    assert patched.json()["description"] == "Social tea"

    ops = auth_header(tokens["ops"])
    ops_seen = await client.get(f"/api/v1/community/{event_id}", headers=ops)
    assert ops_seen.status_code == 200

    deleted = await client.delete(f"/api/v1/community/{event_id}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["id"] == event_id
    missing = await client.get(f"/api/v1/community/{event_id}", headers=headers)
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_senior_registers_and_cannot_duplicate(client, tokens, ids):
    admin = auth_header(tokens["admin"])
    created_event = await client.post(
        "/api/v1/community/",
        headers=admin,
        json={"title": "Senior bingo", "description": "Own seat", "event_date": EVENT_AT, "capacity": 10},
    )
    assert created_event.status_code == 200, created_event.text
    event_id = created_event.json()["id"]
    headers = auth_header(tokens["senior"])
    created = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=headers,
        json={},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert_registration_shape(body)
    assert body["event_id"] == event_id
    assert body["user_id"] == ids["john_user"]
    assert body["status"] == "REGISTERED"
    assert body["event_title"] == "Senior bingo"

    duplicate = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=headers,
        json={},
    )
    assert duplicate.status_code == 409

    listed = await client.get("/api/v1/community/registrations", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
    assert any(item["id"] == body["id"] for item in listed.json()["items"])
    assert all(item["user_id"] == ids["john_user"] for item in listed.json()["items"])
    assert_registration_shape(listed.json()["items"][0])

    other = await client.get("/api/v1/community/registrations", headers=auth_header(tokens["senior2"]))
    assert other.status_code == 200
    assert all(item["id"] != body["id"] for item in other.json()["items"])

    forbidden = await client.patch(
        f"/api/v1/community/registrations/{body['id']}",
        headers=auth_header(tokens["senior2"]),
        json={"status": "CANCELLED"},
    )
    assert forbidden.status_code == 403

    cancelled = await client.patch(
        f"/api/v1/community/registrations/{body['id']}",
        headers=headers,
        json={"status": "CANCELLED"},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "CANCELLED"

    again = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=headers,
        json={},
    )
    assert again.status_code == 200
    assert again.json()["status"] == "REGISTERED"
    assert again.json()["id"] == body["id"]

    restore = await client.patch(
        f"/api/v1/community/registrations/{body['id']}",
        headers=headers,
        json={"status": "CANCELLED"},
    )
    assert restore.status_code == 200
    await client.delete(f"/api/v1/community/{event_id}", headers=admin)


@pytest.mark.asyncio
async def test_family_registration_uses_family_senior_access(client, tokens, ids):
    admin = auth_header(tokens["admin"])
    created = await client.post(
        "/api/v1/community/",
        headers=admin,
        json={"title": "Family bingo", "description": "Access check", "event_date": EVENT_AT, "capacity": 10},
    )
    assert created.status_code == 200, created.text
    event_id = created.json()["id"]
    family = auth_header(tokens["family"])
    family2 = auth_header(tokens["family2"])
    allowed = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=family,
        json={"senior_id": ids["john"]},
    )
    assert allowed.status_code == 200, allowed.text
    assert allowed.json()["user_id"] == ids["john_user"]
    assert allowed.json()["status"] == "REGISTERED"

    denied = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=family,
        json={"senior_id": ids["jane"]},
    )
    assert denied.status_code == 403

    outsider = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=family2,
        json={"senior_id": ids["john"]},
    )
    assert outsider.status_code == 403

    family_list = await client.get("/api/v1/community/registrations", headers=family)
    assert family_list.status_code == 200
    assert any(item["id"] == allowed.json()["id"] for item in family_list.json()["items"])

    family2_list = await client.get("/api/v1/community/registrations", headers=family2)
    assert family2_list.status_code == 200
    assert all(item["id"] != allowed.json()["id"] for item in family2_list.json()["items"])

    cancel = await client.patch(
        f"/api/v1/community/registrations/{allowed.json()['id']}",
        headers=family,
        json={"status": "CANCELLED"},
    )
    assert cancel.status_code == 200
    await client.delete(f"/api/v1/community/{event_id}", headers=admin)


@pytest.mark.asyncio
async def test_unknown_event_registration_returns_404(client, tokens):
    response = await client.post(
        f"/api/v1/community/{UNKNOWN_ID}/register",
        headers=auth_header(tokens["senior"]),
        json={},
    )
    assert response.status_code == 404
    missing = await client.patch(
        f"/api/v1/community/registrations/{UNKNOWN_ID}",
        headers=auth_header(tokens["senior"]),
        json={"status": "CANCELLED"},
    )
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_capacity_reached_returns_409(client, tokens, ids):
    headers = auth_header(tokens["admin"])
    created = await client.post(
        "/api/v1/community/",
        headers=headers,
        json={"title": "Tiny class", "description": "One seat", "event_date": EVENT_AT, "capacity": 1},
    )
    assert created.status_code == 200, created.text
    event_id = created.json()["id"]

    first = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=auth_header(tokens["senior"]),
        json={},
    )
    assert first.status_code == 200, first.text
    second = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=auth_header(tokens["senior2"]),
        json={},
    )
    assert second.status_code == 409

    await client.delete(f"/api/v1/community/{event_id}", headers=headers)


@pytest.mark.asyncio
async def test_null_capacity_does_not_invent_a_limit(client, tokens):
    headers = auth_header(tokens["admin"])
    created = await client.post(
        "/api/v1/community/",
        headers=headers,
        json={"title": "Open gathering", "description": "No cap", "event_date": EVENT_AT, "capacity": None},
    )
    assert created.status_code == 200, created.text
    event_id = created.json()["id"]
    assert created.json()["capacity"] is None
    first = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=auth_header(tokens["senior"]),
        json={},
    )
    second = await client.post(
        f"/api/v1/community/{event_id}/register",
        headers=auth_header(tokens["senior2"]),
        json={},
    )
    assert first.status_code == 200
    assert second.status_code == 200
    await client.delete(f"/api/v1/community/{event_id}", headers=headers)


@pytest.mark.asyncio
async def test_care_manager_cannot_register(client, tokens, ids):
    response = await client.post(
        f"/api/v1/community/{ids['bingo']}/register",
        headers=auth_header(tokens["care"]),
        json={},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_openapi_community_contracts(client):
    spec = (await client.get("/openapi.json")).json()
    paths = spec["paths"]
    schemas = spec["components"]["schemas"]
    assert "get" in paths["/api/v1/community/"]
    assert "post" in paths["/api/v1/community/"]
    detail = "/api/v1/community/{event_id}"
    assert "get" in paths[detail]
    assert "patch" in paths[detail]
    assert "delete" in paths[detail]
    assert "post" in paths["/api/v1/community/{event_id}/register"]
    assert "get" in paths["/api/v1/community/registrations"]
    assert "patch" in paths["/api/v1/community/registrations/{registration_id}"]
    for name in (
        "CommunityEventResponse",
        "CommunityEventCreate",
        "CommunityEventUpdate",
        "EventRegistrationResponse",
        "EventRegistrationCreate",
        "EventRegistrationUpdate",
        "RegistrationStatus",
    ):
        assert name in schemas, name
    assert "CommunityResponse" not in schemas
    assert "CommunityCreate" not in schemas
    assert "CommunityEventItem" not in schemas
    event_props = set(schemas["CommunityEventResponse"]["properties"].keys())
    assert event_props == EVENT_KEYS
    create_props = set(schemas["CommunityEventCreate"]["properties"].keys())
    assert create_props == {"title", "description", "event_date", "capacity"}
    update_props = set(schemas["CommunityEventUpdate"]["properties"].keys())
    assert update_props == {"title", "description", "event_date", "capacity"}
    registration_props = set(schemas["EventRegistrationResponse"]["properties"].keys())
    assert registration_props == REGISTRATION_KEYS
    assert set(schemas["RegistrationStatus"]["enum"]) == {"REGISTERED", "CANCELLED"}
    assert "location" not in event_props
    assert "image_url" not in event_props
    assert paths["/api/v1/community/"]["get"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths["/api/v1/community/"]["post"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths[detail]["get"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths["/api/v1/community/{event_id}/register"]["post"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths["/api/v1/community/registrations"]["get"].get("security") == [{"OAuth2PasswordBearer": []}]
