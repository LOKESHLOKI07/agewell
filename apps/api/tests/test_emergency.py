"""Phase 4.6B emergency case and event API."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.modules.emergency.repository import CREATED_EVENT_DESCRIPTION
from tests.emergency_helpers import close_active_emergencies, ensure_senior_in_service_area

SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
FAMILY_EMAIL = "family@example.com"
FAMILY2_EMAIL = "family2@example.com"
CARE_EMAIL = "care@example.com"
COMPANION_EMAIL = "companion@example.com"
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


async def prepare_john_sos(client: AsyncClient) -> tuple[str, str, str, dict]:
    senior = await login(client, SENIOR_EMAIL)
    admin = await login(client, ADMIN_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    await ensure_senior_in_service_area(client, me["id"], admin, True)
    await close_active_emergencies(client, senior, admin)
    return senior, admin, me["id"], me


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
    assert {"id", "senior_id", "type", "status", "created_at"}.issubset(medical.keys())
    assert "recipients" in medical
    assert "case_number" in medical


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
    token, _admin, senior_id, _me = await prepare_john_sos(client)
    headers = auth_header(token)
    created = await client.post("/api/v1/emergency/", headers=headers, json={"type": "HOSPITAL"})
    assert created.status_code == 200
    body = created.json()
    assert body["senior_id"] == senior_id
    assert body["type"] == "HOSPITAL"
    assert body["status"] == "OPEN"
    assert body["trigger_source"] == "APP_SOS"
    assert body["case_number"]
    assert len(body["recipients"]) == 4
    assert {item["role"] for item in body["recipients"]} == {
        "FAMILY",
        "CARE_MANAGER",
        "COMPANION",
        "AGEWELL_SUPPORT",
    }
    assert all(item["status"] == "PENDING" for item in body["recipients"])
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
    assert set(schemas["EmergencyCaseResponse"]["properties"].keys()) >= {
        "id",
        "senior_id",
        "type",
        "status",
        "created_at",
        "case_number",
        "trigger_source",
        "recipients",
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
    assert "/api/v1/emergency/{emergency_id}/acknowledge" in paths
    assert "/api/v1/emergency/{emergency_id}/report" in paths
    assert "securitySchemes" in spec.get("components", {})


@pytest.mark.asyncio
async def test_care_manager_acknowledge_is_per_recipient(client):
    senior, _admin, _senior_id, _me = await prepare_john_sos(client)
    care = await login(client, CARE_EMAIL)
    created = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(senior),
        json={"type": "MEDICAL", "trigger_source": "APP_SOS"},
    )
    assert created.status_code == 200
    case_id = created.json()["id"]

    ack = await client.post(f"/api/v1/emergency/{case_id}/acknowledge", headers=auth_header(care))
    assert ack.status_code == 200
    body = ack.json()
    by_role = {item["role"]: item for item in body["recipients"]}
    assert by_role["CARE_MANAGER"]["status"] == "RESPONDED"
    assert by_role["CARE_MANAGER"]["responded_at"] is not None
    assert by_role["FAMILY"]["status"] == "PENDING"
    assert by_role["COMPANION"]["status"] == "PENDING"
    assert body["status"] == "IN_PROGRESS"

    family = await login(client, FAMILY_EMAIL)
    family_ack = await client.post(
        f"/api/v1/emergency/{case_id}/acknowledge",
        headers=auth_header(family),
    )
    assert family_ack.status_code == 200
    by_role = {item["role"]: item for item in family_ack.json()["recipients"]}
    assert by_role["FAMILY"]["status"] == "RESPONDED"
    assert by_role["CARE_MANAGER"]["status"] == "RESPONDED"
    assert by_role["COMPANION"]["status"] == "PENDING"


@pytest.mark.asyncio
async def test_staff_can_file_emergency_report(client):
    senior, _admin, _senior_id, _me = await prepare_john_sos(client)
    care = await login(client, CARE_EMAIL)
    created = await client.post("/api/v1/emergency/", headers=auth_header(senior), json={"type": "MEDICAL"})
    case_id = created.json()["id"]
    await client.post(f"/api/v1/emergency/{case_id}/acknowledge", headers=auth_header(care))
    reported = await client.patch(
        f"/api/v1/emergency/{case_id}/report",
        headers=auth_header(care),
        json={
            "what_happened": "Fall at home",
            "action_taken": "Care Manager attended and coordinated support",
            "hospital_required": False,
            "mark_resolved": True,
        },
    )
    assert reported.status_code == 200
    body = reported.json()
    assert body["what_happened"] == "Fall at home"
    assert body["hospital_required"] is False
    assert body["status"] == "RESOLVED"
    assert body["resolved_at"] is not None


@pytest.mark.asyncio
async def test_sos_stages_care_manager_until_escalation(client):
    senior, admin, _senior_id, _me = await prepare_john_sos(client)
    family = await login(client, FAMILY_EMAIL)
    care = await login(client, CARE_EMAIL)
    created = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(senior),
        json={"type": "MEDICAL", "trigger_source": "APP_SOS"},
    )
    assert created.status_code == 200
    body = created.json()
    case_id = body["id"]
    by_role = {item["role"]: item for item in body["recipients"]}
    assert by_role["FAMILY"]["notified_at"] is not None
    assert by_role["COMPANION"]["notified_at"] is not None
    assert by_role["CARE_MANAGER"]["notified_at"] is None
    assert by_role["AGEWELL_SUPPORT"]["notified_at"] is None

    from uuid import UUID

    from app.db.session import AsyncSessionLocal
    from app.modules.access.repository import AccessRepository
    from app.modules.audit.repository import AuditRepository
    from app.modules.emergency.repository import EmergencyRepository
    from app.modules.emergency.service import EmergencyService
    from app.modules.memberships.repository import MembershipRepository
    from app.modules.notifications.repository import NotificationRepository
    from app.modules.seniors.repository import SeniorRepository

    care_before = {
        item["id"]
        for item in (await client.get("/api/v1/notifications/", headers=auth_header(care))).json()["items"]
    }

    async with AsyncSessionLocal() as session:
        service = EmergencyService(
            EmergencyRepository(session),
            NotificationRepository(session),
            AccessRepository(session),
            SeniorRepository(session),
            AuditRepository(session),
            MembershipRepository(session),
        )
        escalated = await service.escalate_if_needed(UUID(case_id))
        assert escalated is not None
        by_role = {item.role: item for item in escalated.recipients}
        assert by_role["CARE_MANAGER"].notified_at is not None
        assert by_role["AGEWELL_SUPPORT"].notified_at is not None

    care_after = (await client.get("/api/v1/notifications/", headers=auth_header(care))).json()["items"]
    care_new = [item for item in care_after if item["id"] not in care_before]
    assert len(care_new) == 1
    assert care_new[0]["priority"] == "EMERGENCY"

    # Family already acknowledged: escalate must not notify Care Manager.
    await close_active_emergencies(client, senior, admin)
    created2 = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(senior),
        json={"type": "HOSPITAL", "trigger_source": "APP_SOS"},
    )
    assert created2.status_code == 200
    case2 = created2.json()["id"]
    ack = await client.post(f"/api/v1/emergency/{case2}/acknowledge", headers=auth_header(family))
    assert ack.status_code == 200
    assert any(r["role"] == "FAMILY" and r["status"] == "RESPONDED" for r in ack.json()["recipients"])

    before_care = {
        item["id"]
        for item in (await client.get("/api/v1/notifications/", headers=auth_header(care))).json()["items"]
    }
    async with AsyncSessionLocal() as session:
        service = EmergencyService(
            EmergencyRepository(session),
            NotificationRepository(session),
            AccessRepository(session),
            SeniorRepository(session),
            AuditRepository(session),
            MembershipRepository(session),
        )
        skipped = await service.escalate_if_needed(UUID(case2))
        assert skipped is not None
        by_role = {item.role: item for item in skipped.recipients}
        assert by_role["CARE_MANAGER"].notified_at is None

    after_care = (await client.get("/api/v1/notifications/", headers=auth_header(care))).json()["items"]
    new_care = [item for item in after_care if item["id"] not in before_care]
    assert new_care == []


@pytest.mark.asyncio
async def test_public_stub_is_gone(client):
    response = await client.get("/api/v1/emergency/")
    assert response.status_code == 401
    assert response.json() != []


@pytest.mark.asyncio
async def test_inactive_membership_cannot_create_emergency(client):
    token = await login(client, SENIOR2_EMAIL)
    created = await client.post("/api/v1/emergency/", headers=auth_header(token), json={"type": "MEDICAL"})
    assert created.status_code == 403
    assert "membership" in created.json()["detail"].lower()


@pytest.mark.asyncio
async def test_service_area_rule_blocks_emergency_create(client):
    senior, admin, senior_id, _me = await prepare_john_sos(client)
    await ensure_senior_in_service_area(client, senior_id, admin, False)
    created = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(senior),
        json={"type": "MEDICAL", "trigger_source": "HOME_PANIC_BUTTON"},
    )
    assert created.status_code == 403
    assert "service area" in created.json()["detail"].lower()
    await ensure_senior_in_service_area(client, senior_id, admin, True)


@pytest.mark.asyncio
async def test_duplicate_active_emergency_rejected(client):
    senior, _admin, _senior_id, _me = await prepare_john_sos(client)
    first = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(senior),
        json={"type": "MEDICAL", "trigger_source": "APP_SOS"},
    )
    assert first.status_code == 200
    duplicate = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(senior),
        json={"type": "MEDICAL", "trigger_source": "HOME_PANIC_BUTTON"},
    )
    assert duplicate.status_code == 409
    assert "already active" in duplicate.json()["detail"].lower()


@pytest.mark.asyncio
async def test_home_panic_button_creates_open_medical_and_notifies_family_companion(client):
    senior, _admin, senior_id, _me = await prepare_john_sos(client)
    family = await login(client, FAMILY_EMAIL)
    companion = await login(client, COMPANION_EMAIL)
    care = await login(client, CARE_EMAIL)

    before_family = {
        item["id"] for item in (await client.get("/api/v1/notifications/", headers=auth_header(family))).json()["items"]
    }
    before_companion = {
        item["id"]
        for item in (await client.get("/api/v1/notifications/", headers=auth_header(companion))).json()["items"]
    }
    before_care = {
        item["id"] for item in (await client.get("/api/v1/notifications/", headers=auth_header(care))).json()["items"]
    }

    created = await client.post(
        "/api/v1/emergency/",
        headers=auth_header(senior),
        json={"type": "MEDICAL", "trigger_source": "HOME_PANIC_BUTTON"},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["senior_id"] == senior_id
    assert body["type"] == "MEDICAL"
    assert body["status"] == "OPEN"
    assert body["trigger_source"] == "HOME_PANIC_BUTTON"
    assert body["first_response"] == {"family": "SENT", "companion": "SENT"}
    by_role = {item["role"]: item for item in body["recipients"]}
    assert by_role["FAMILY"]["notified_at"] is not None
    assert by_role["COMPANION"]["notified_at"] is not None
    assert by_role["CARE_MANAGER"]["notified_at"] is None
    assert by_role["AGEWELL_SUPPORT"]["notified_at"] is None

    family_new = [
        item
        for item in (await client.get("/api/v1/notifications/", headers=auth_header(family))).json()["items"]
        if item["id"] not in before_family
    ]
    companion_new = [
        item
        for item in (await client.get("/api/v1/notifications/", headers=auth_header(companion))).json()["items"]
        if item["id"] not in before_companion
    ]
    care_new = [
        item
        for item in (await client.get("/api/v1/notifications/", headers=auth_header(care))).json()["items"]
        if item["id"] not in before_care
    ]
    assert len(family_new) == 1
    assert family_new[0]["priority"] == "EMERGENCY"
    assert len(companion_new) == 1
    assert companion_new[0]["priority"] == "EMERGENCY"
    assert care_new == []


@pytest.mark.asyncio
async def test_escalation_after_configured_delay_and_skips(client):
    from datetime import datetime, timedelta, timezone
    from unittest.mock import patch
    from uuid import UUID

    from app.db.session import AsyncSessionLocal
    from app.modules.emergency.escalation import recover_pending_escalations
    from app.modules.emergency.models import EmergencyStatus
    from app.modules.emergency.repository import EmergencyRepository
    from app.modules.emergency.service import EmergencyService
    from app.modules.access.repository import AccessRepository
    from app.modules.audit.repository import AuditRepository
    from app.modules.memberships.repository import MembershipRepository
    from app.modules.notifications.repository import NotificationRepository
    from app.modules.seniors.repository import SeniorRepository

    senior, admin, _senior_id, _me = await prepare_john_sos(client)
    family = await login(client, FAMILY_EMAIL)
    companion = await login(client, COMPANION_EMAIL)
    care = await login(client, CARE_EMAIL)

    async def create_case():
        await close_active_emergencies(client, senior, admin)
        with patch("app.modules.emergency.escalation.schedule_care_manager_escalation"):
            created = await client.post(
                "/api/v1/emergency/",
                headers=auth_header(senior),
                json={"type": "MEDICAL", "trigger_source": "HOME_PANIC_BUTTON"},
            )
        assert created.status_code == 200, created.text
        return created.json()["id"]

    async def make_due(case_id: str) -> None:
        async with AsyncSessionLocal() as session:
            case = await EmergencyRepository(session).get_case_by_id(UUID(case_id))
            assert case is not None
            case.escalation_due_at = datetime.now(timezone.utc) - timedelta(seconds=1)
            await session.commit()

    async def escalate_service(case_id: str):
        async with AsyncSessionLocal() as session:
            service = EmergencyService(
                EmergencyRepository(session),
                NotificationRepository(session),
                AccessRepository(session),
                SeniorRepository(session),
                AuditRepository(session),
                MembershipRepository(session),
            )
            return await service.escalate_if_needed(UUID(case_id))

    case_id = await create_case()
    async with AsyncSessionLocal() as session:
        case = await EmergencyRepository(session).get_case_by_id(UUID(case_id))
        assert case is not None
        assert case.escalation_due_at is not None
        due_ids = await EmergencyRepository(session).list_due_escalation_ids(now=datetime.now(timezone.utc))
        assert case.id not in due_ids

    await make_due(case_id)
    recovered = await recover_pending_escalations()
    assert recovered >= 1
    detail = (await client.get(f"/api/v1/emergency/{case_id}", headers=auth_header(senior))).json()
    by_role = {item["role"]: item for item in detail["recipients"]}
    assert by_role["CARE_MANAGER"]["notified_at"] is not None
    assert by_role["AGEWELL_SUPPORT"]["notified_at"] is not None

    case_id = await create_case()
    ack = await client.post(f"/api/v1/emergency/{case_id}/acknowledge", headers=auth_header(family))
    assert ack.status_code == 200
    skipped = await escalate_service(case_id)
    assert skipped is not None
    by_role = {item.role: item for item in skipped.recipients}
    assert by_role["CARE_MANAGER"].notified_at is None

    case_id = await create_case()
    ack = await client.post(f"/api/v1/emergency/{case_id}/acknowledge", headers=auth_header(companion))
    assert ack.status_code == 200
    skipped = await escalate_service(case_id)
    assert skipped is not None
    by_role = {item.role: item for item in skipped.recipients}
    assert by_role["CARE_MANAGER"].notified_at is None
    assert by_role["COMPANION"].status == "RESPONDED"

    case_id = await create_case()
    cancelled = await client.patch(
        f"/api/v1/emergency/{case_id}",
        headers=auth_header(admin),
        json={"status": EmergencyStatus.CANCELLED.value},
    )
    assert cancelled.status_code == 200
    skipped = await escalate_service(case_id)
    assert skipped is not None
    by_role = {item.role: item for item in skipped.recipients}
    assert by_role["CARE_MANAGER"].notified_at is None

    case_id = await create_case()
    resolved = await client.patch(
        f"/api/v1/emergency/{case_id}",
        headers=auth_header(admin),
        json={"status": EmergencyStatus.RESOLVED.value},
    )
    assert resolved.status_code == 200
    skipped = await escalate_service(case_id)
    assert skipped is not None
    by_role = {item.role: item for item in skipped.recipients}
    assert by_role["CARE_MANAGER"].notified_at is None

    case_id = await create_case()
    await make_due(case_id)
    recovered = await recover_pending_escalations()
    assert recovered >= 1
    again = await recover_pending_escalations()
    assert again == 0


@pytest.mark.asyncio
async def test_escalation_survives_missing_in_process_timer(client):
    from datetime import datetime, timedelta, timezone
    from unittest.mock import patch
    from uuid import UUID

    from app.db.session import AsyncSessionLocal
    from app.modules.emergency.escalation import recover_pending_escalations
    from app.modules.emergency.repository import EmergencyRepository

    senior, admin, _senior_id, _me = await prepare_john_sos(client)
    care = await login(client, CARE_EMAIL)
    with patch("app.modules.emergency.escalation.schedule_care_manager_escalation"):
        created = await client.post(
            "/api/v1/emergency/",
            headers=auth_header(senior),
            json={"type": "MEDICAL", "trigger_source": "HOME_PANIC_BUTTON"},
        )
    assert created.status_code == 200, created.text
    case_id = created.json()["id"]
    before_care = {
        item["id"] for item in (await client.get("/api/v1/notifications/", headers=auth_header(care))).json()["items"]
    }
    async with AsyncSessionLocal() as session:
        case = await EmergencyRepository(session).get_case_by_id(UUID(case_id))
        assert case is not None
        case.escalation_due_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        await session.commit()

    assert await recover_pending_escalations() >= 1
    care_after = (await client.get("/api/v1/notifications/", headers=auth_header(care))).json()["items"]
    care_new = [item for item in care_after if item["id"] not in before_care]
    assert len(care_new) == 1
    assert care_new[0]["priority"] == "EMERGENCY"
    assert await recover_pending_escalations() == 0
