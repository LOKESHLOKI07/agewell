"""Phase 4.7 in-app notifications."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.modules.notifications.emergency_copy import (
    care_manager_emergency_copy,
    family_emergency_copy,
    senior_emergency_copy,
)

SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
FAMILY_EMAIL = "family@example.com"
FAMILY2_EMAIL = "family2@example.com"
CARE_EMAIL = "care@example.com"
PASSWORD = "password123"
MISSING_ID = "00000000-0000-0000-0000-000000000001"
FORBIDDEN_COPY = (
    "ambulance",
    "112",
    "sms",
    "fcm",
    "whatsapp",
    "email",
    "gps",
    "websocket",
    "push",
)


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


async def list_notifications(client: AsyncClient, token: str, unread_only: bool = False) -> dict:
    response = await client.get(
        "/api/v1/notifications/",
        headers=auth_header(token),
        params={"unread_only": unread_only} if unread_only else None,
    )
    assert response.status_code == 200
    return response.json()


def ids(payload: dict) -> set:
    return {item["id"] for item in payload["items"]}


def assert_in_app_copy(item: dict) -> None:
    blob = f"{item.get('title') or ''} {item.get('message') or ''}".lower()
    for word in FORBIDDEN_COPY:
        assert word not in blob


@pytest.mark.asyncio
async def test_notifications_are_user_scoped(client):
    senior = await login(client, SENIOR_EMAIL)
    other = await login(client, SENIOR2_EMAIL)
    mine = await list_notifications(client, senior)
    theirs = await list_notifications(client, other)
    assert mine["total"] >= 1
    assert ids(mine).isdisjoint(ids(theirs))
    assert all(item["priority"] in {"INFO", "IMPORTANT", "EMERGENCY"} for item in mine["items"])
    assert "user_id" not in mine["items"][0]


@pytest.mark.asyncio
async def test_notifications_require_auth(client):
    assert (await client.get("/api/v1/notifications/")).status_code == 401
    assert (await client.get(f"/api/v1/notifications/{MISSING_ID}")).status_code == 401
    assert (await client.post(f"/api/v1/notifications/{MISSING_ID}/read")).status_code == 401
    assert (await client.post("/api/v1/notifications/read-all")).status_code == 401


@pytest.mark.asyncio
async def test_unknown_notification(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)
    assert (await client.get(f"/api/v1/notifications/{MISSING_ID}", headers=headers)).status_code == 404
    assert (await client.post(f"/api/v1/notifications/{MISSING_ID}/read", headers=headers)).status_code == 404


@pytest.mark.asyncio
async def test_cannot_read_another_users_notification(client):
    senior = await login(client, SENIOR_EMAIL)
    other = await login(client, SENIOR2_EMAIL)
    mine = await list_notifications(client, senior)
    notification_id = mine["items"][0]["id"]
    detail = await client.get(f"/api/v1/notifications/{notification_id}", headers=auth_header(other))
    marked = await client.post(f"/api/v1/notifications/{notification_id}/read", headers=auth_header(other))
    assert detail.status_code == 403
    assert marked.status_code == 403


@pytest.mark.asyncio
async def test_mark_as_read_and_unread_filter(client):
    token = await login(client, SENIOR_EMAIL)
    created = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(token),
        json={"type": "AGEWELL_SUPPORT"},
    )
    assert created.status_code == 200
    unread = await list_notifications(client, token, unread_only=True)
    target = next(item for item in unread["items"] if item["priority"] == "EMERGENCY" and item["is_read"] is False)
    detail = await client.get(f"/api/v1/notifications/{target['id']}", headers=auth_header(token))
    assert detail.status_code == 200
    assert detail.json()["is_read"] is False
    marked = await client.post(f"/api/v1/notifications/{target['id']}/read", headers=auth_header(token))
    assert marked.status_code == 200
    assert marked.json()["is_read"] is True
    again = await client.post(f"/api/v1/notifications/{target['id']}/read", headers=auth_header(token))
    assert again.status_code == 200
    assert again.json()["is_read"] is True
    unread_after = await list_notifications(client, token, unread_only=True)
    assert target["id"] not in ids(unread_after)


@pytest.mark.asyncio
async def test_mark_all_read(client):
    token = await login(client, SENIOR2_EMAIL)
    created = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(token),
        json={"type": "MEDICAL"},
    )
    assert created.status_code == 200
    unread_before = await list_notifications(client, token, unread_only=True)
    assert unread_before["total"] >= 1
    response = await client.post("/api/v1/notifications/read-all", headers=auth_header(token))
    assert response.status_code == 200
    assert response.json()["updated"] >= 1
    unread_after = await list_notifications(client, token, unread_only=True)
    assert unread_after["total"] == 0


@pytest.mark.asyncio
async def test_emergency_create_fans_out_in_app_notifications(client):
    senior = await login(client, SENIOR_EMAIL)
    family = await login(client, FAMILY_EMAIL)
    family2 = await login(client, FAMILY2_EMAIL)
    care = await login(client, CARE_EMAIL)
    other = await login(client, SENIOR2_EMAIL)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()

    before = {
        "senior": ids(await list_notifications(client, senior)),
        "family": ids(await list_notifications(client, family)),
        "family2": ids(await list_notifications(client, family2)),
        "care": ids(await list_notifications(client, care)),
        "other": ids(await list_notifications(client, other)),
    }

    created = await client.post("/api/v1/emergency/", headers=auth_header(senior), json={"type": "HOSPITAL"})
    assert created.status_code == 200

    after = {
        "senior": await list_notifications(client, senior),
        "family": await list_notifications(client, family),
        "family2": await list_notifications(client, family2),
        "care": await list_notifications(client, care),
        "other": await list_notifications(client, other),
    }

    senior_new = [item for item in after["senior"]["items"] if item["id"] not in before["senior"]]
    family_new = [item for item in after["family"]["items"] if item["id"] not in before["family"]]
    care_new = [item for item in after["care"]["items"] if item["id"] not in before["care"]]
    assert len(senior_new) == 1
    assert len(family_new) == 1
    assert len(care_new) == 1
    assert ids(after["family2"]).issubset(before["family2"])
    assert ids(after["other"]).issubset(before["other"])

    type_label = "Hospital Assistance"
    senior_title, senior_message = senior_emergency_copy(type_label)
    family_title, family_message = family_emergency_copy(john["first_name"], type_label)
    care_title, care_message = care_manager_emergency_copy(type_label)

    assert senior_new[0]["priority"] == "EMERGENCY"
    assert senior_new[0]["is_read"] is False
    assert senior_new[0]["title"] == senior_title
    assert senior_new[0]["message"] == senior_message
    assert family_new[0]["title"] == family_title
    assert family_new[0]["message"] == family_message
    assert care_new[0]["title"] == care_title
    assert care_new[0]["message"] == care_message
    for item in (*senior_new, *family_new, *care_new):
        assert_in_app_copy(item)


@pytest.mark.asyncio
async def test_unauthorized_family_does_not_receive_emergency_notification(client):
    family2 = await login(client, FAMILY2_EMAIL)
    before = ids(await list_notifications(client, family2))
    senior = await login(client, SENIOR_EMAIL)
    created = await client.post("/api/v1/emergency/", headers=auth_header(senior), json={"type": "MEDICAL"})
    assert created.status_code == 200
    after = await list_notifications(client, family2)
    assert ids(after) == before


@pytest.mark.asyncio
async def test_notifications_openapi(client):
    spec = (await client.get("/openapi.json")).json()
    paths = spec["paths"]
    assert "get" in paths["/api/v1/notifications/"]
    assert "post" in paths["/api/v1/notifications/read-all"]
    assert "get" in paths["/api/v1/notifications/{notification_id}"]
    assert "post" in paths["/api/v1/notifications/{notification_id}/read"]
    schema = spec["components"]["schemas"]["NotificationResponse"]["properties"]
    assert set(schema.keys()) == {"id", "title", "message", "priority", "is_read", "created_at"}
    assert "user_id" not in schema
    assert "emergency_case_id" not in schema
