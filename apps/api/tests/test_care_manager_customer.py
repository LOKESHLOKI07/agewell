from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.timezone import now_in_app_timezone
from app.main import app
from app.modules.care.booking import (
    CALL_HOURS_MESSAGE,
    is_care_manager_call_open,
    is_visit_slot_bookable,
    list_visit_slots,
    visit_slot_at,
)

SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
FAMILY_EMAIL = "family@example.com"
ADMIN_EMAIL = "admin@example.com"
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


def test_call_hours_and_visit_slots():
    open_at = datetime(2026, 9, 10, 10, 0, tzinfo=now_in_app_timezone().tzinfo)
    closed_at = datetime(2026, 9, 10, 18, 0, tzinfo=now_in_app_timezone().tzinfo)
    assert is_care_manager_call_open(open_at) is True
    assert is_care_manager_call_open(closed_at) is False
    day = now_in_app_timezone().date() + timedelta(days=2)
    slots = list_visit_slots(day)
    assert slots
    assert is_visit_slot_bookable(slots[0]) is True
    past = visit_slot_at(now_in_app_timezone().date() - timedelta(days=1), 10)
    assert is_visit_slot_bookable(past) is False


@pytest.mark.asyncio
async def test_assigned_care_manager_open_to_senior(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get("/api/v1/care/assigned", headers=auth_header(token))
    assert response.status_code == 200
    body = response.json()
    assert body["assigned"] is True
    assert body["care_manager"]["name"] == "Rohit Sharma"
    assert "phone" in body["care_manager"]


@pytest.mark.asyncio
async def test_unassigned_senior_sees_empty_assignment(client):
    token = await login(client, SENIOR2_EMAIL)
    response = await client.get("/api/v1/care/assigned", headers=auth_header(token))
    assert response.status_code == 200
    body = response.json()
    assert body["assigned"] is False
    assert body["care_manager"] is None


@pytest.mark.asyncio
async def test_family_can_read_assigned_care_manager(client):
    token = await login(client, FAMILY_EMAIL)
    response = await client.get("/api/v1/care/assigned", headers=auth_header(token))
    assert response.status_code == 200
    assert response.json()["assigned"] is True


@pytest.mark.asyncio
async def test_assigned_companion_open_to_senior(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get(
        "/api/v1/care/assigned",
        headers=auth_header(token),
        params={"staff_kind": "COMPANION"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["assigned"] is True
    assert body["care_manager"]["name"] == "Meera Iyer"
    assert body["care_manager"]["staff_kind"] == "COMPANION"


@pytest.mark.asyncio
async def test_unassigned_senior_sees_empty_companion(client):
    token = await login(client, SENIOR2_EMAIL)
    response = await client.get(
        "/api/v1/care/assigned",
        headers=auth_header(token),
        params={"staff_kind": "COMPANION"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["assigned"] is False
    assert body["care_manager"] is None


@pytest.mark.asyncio
async def test_call_outside_hours_is_rejected(client, monkeypatch):
    monkeypatch.setattr("app.modules.care.activity_service.is_care_manager_call_open", lambda now=None: False)
    token = await login(client, SENIOR_EMAIL)
    response = await client.post("/api/v1/care/activities/call", headers=auth_header(token), json={})
    assert response.status_code == 400
    assert response.json()["detail"] == CALL_HOURS_MESSAGE


@pytest.mark.asyncio
async def test_call_message_and_visit_create_activity(client, monkeypatch):
    monkeypatch.setattr("app.modules.care.activity_service.is_care_manager_call_open", lambda now=None: True)
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)

    call = await client.post("/api/v1/care/activities/call", headers=headers, json={})
    assert call.status_code == 200
    assert call.json()["activity_type"] == "CALL"
    assert call.json()["status"] == "REQUESTED"
    assert call.json()["icon"] == "call-outline"

    message = await client.post("/api/v1/care/activities/message", headers=headers, json={})
    assert message.status_code == 200
    assert message.json()["activity_type"] == "MESSAGE"

    day = now_in_app_timezone().date() + timedelta(days=2)
    slots = await client.get("/api/v1/care/visit-slots", headers=headers, params={"date": day.isoformat()})
    assert slots.status_code == 200
    assert slots.json()["slots"]
    start_at = slots.json()["slots"][0]["start_at"]
    visit = await client.post(
        "/api/v1/care/activities/visit",
        headers=headers,
        json={"scheduled_at": start_at, "reason": "Monthly wellbeing check"},
    )
    assert visit.status_code == 200
    assert visit.json()["activity_type"] == "VISIT"
    assert visit.json()["status"] == "SCHEDULED"
    assert visit.json()["reason"] == "Monthly wellbeing check"
    assert visit.json()["visit_id"]

    listed = await client.get("/api/v1/care/activities", headers=headers)
    assert listed.status_code == 200
    types = {item["activity_type"] for item in listed.json()["items"]}
    assert {"CALL", "MESSAGE", "VISIT"}.issubset(types)


@pytest.mark.asyncio
async def test_admin_updates_activity_follow_up(client, monkeypatch):
    monkeypatch.setattr("app.modules.care.activity_service.is_care_manager_call_open", lambda now=None: True)
    senior_token = await login(client, SENIOR_EMAIL)
    created = await client.post("/api/v1/care/activities/call", headers=auth_header(senior_token), json={})
    assert created.status_code == 200
    activity_id = created.json()["id"]

    admin_token = await login(client, ADMIN_EMAIL)
    updated = await client.patch(
        f"/api/v1/care/activities/{activity_id}",
        headers=auth_header(admin_token),
        json={
            "activity_type": "HOME_VISIT",
            "status": "COMPLETED",
            "reason": "General well-being check and service review.",
            "action_taken": "Completed home visit",
            "follow_up_required": True,
            "follow_up_notes": "Follow-up in two weeks",
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["activity_type"] == "HOME_VISIT"
    assert body["icon"] == "home-outline"
    assert body["title"] == "Home Visit Completed"
    assert body["status"] == "COMPLETED"
    assert body["follow_up_required"] is True
