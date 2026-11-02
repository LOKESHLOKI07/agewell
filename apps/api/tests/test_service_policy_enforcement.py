"""Assign, finish, and proof-photo rules against a freshly provisioned team."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"
PROOF = "data:image/jpeg;base64,AAAA"


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
            "first_name": "Policy",
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


async def provision_staff(client: AsyncClient, admin: dict, staff_kind: str, **extra) -> tuple[dict, dict]:
    email = unique_email(staff_kind.lower())
    body = {
        "email": email,
        "phone": unique_phone(),
        "password": PASSWORD,
        "first_name": staff_kind.title(),
        "last_name": "Staff",
        "employee_id": f"{staff_kind[:2]}-{uuid.uuid4().hex[:6].upper()}",
        "staff_kind": staff_kind,
        "status": "ACTIVE",
        **extra,
    }
    created = await client.post("/api/v1/care/provision", headers=admin, json=body)
    assert created.status_code == 200, created.text
    return created.json(), auth_header(await login(client, email))


async def activate_membership(client: AsyncClient, senior: dict, admin: dict) -> None:
    created = await client.post(
        "/api/v1/memberships/requests",
        headers=senior,
        json={
            "plan_key": "single",
            "family_contact_1_name": "Asha Sharma",
            "family_contact_1_phone": "9876543210",
            "family_contact_2_name": "Rohit Sharma",
            "family_contact_2_phone": "9876501234",
            "emergency_contact_name": "Neha Sharma",
            "emergency_contact_phone": "9988776655",
        },
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]
    accepted = await client.patch(
        f"/api/v1/memberships/requests/{request_id}",
        headers=admin,
        json={"status": "APPROVED"},
    )
    assert accepted.status_code == 200, accepted.text
    paid = await client.post(f"/api/v1/memberships/requests/{request_id}/pay", headers=senior)
    assert paid.status_code == 200, paid.text


async def service_id_by_slug(client: AsyncClient, headers: dict, slug: str) -> str:
    listed = await client.get("/api/v1/services/", headers=headers)
    assert listed.status_code == 200, listed.text
    match = next((item for item in listed.json() if item.get("slug") == slug), None)
    assert match is not None, f"Missing service {slug}"
    return match["id"]


async def setup_team(client: AsyncClient):
    admin = auth_header(await login(client, ADMIN_EMAIL))
    senior_token = await register_senior(client, unique_email("policy-senior"))
    senior = auth_header(senior_token)
    me = await client.get("/api/v1/seniors/me", headers=senior)
    assert me.status_code == 200, me.text
    senior_id = me.json()["id"]
    cm, cm_auth = await provision_staff(client, admin, "CARE_MANAGER")
    companion, companion_auth = await provision_staff(client, admin, "COMPANION")
    sc, sc_auth = await provision_staff(
        client,
        admin,
        "SERVICE_COMPANION",
        companion_service_slugs=[
            "grocery",
            "medicine",
            "banking-companion",
            "small-errands",
            "errand-coordination",
        ],
    )
    return {
        "admin": admin,
        "senior": senior,
        "senior_id": senior_id,
        "cm": cm,
        "cm_auth": cm_auth,
        "companion": companion,
        "companion_auth": companion_auth,
        "sc": sc,
        "sc_auth": sc_auth,
    }


@pytest.mark.asyncio
async def test_grocery_assign_and_photo_close(client):
    team = await setup_team(client)
    blocked = await client.post(
        "/api/v1/visits/",
        headers=team["admin"],
        json={
            "senior_id": team["senior_id"],
            "care_manager_id": team["cm"]["id"],
            "service_slug": "grocery",
            "status": "SCHEDULED",
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "notes": "Weekly grocery",
        },
    )
    assert blocked.status_code == 400, blocked.text

    created = await client.post(
        "/api/v1/visits/",
        headers=team["admin"],
        json={
            "senior_id": team["senior_id"],
            "care_manager_id": team["sc"]["id"],
            "service_slug": "grocery",
            "status": "SCHEDULED",
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "notes": "Weekly grocery",
        },
    )
    assert created.status_code == 200, created.text
    visit_id = created.json()["id"]

    companion_close = await client.patch(
        f"/api/v1/visits/{visit_id}",
        headers=team["companion_auth"],
        json={"status": "COMPLETED", "proof_photo": PROOF},
    )
    assert companion_close.status_code == 403, companion_close.text

    missing_photo = await client.patch(
        f"/api/v1/visits/{visit_id}",
        headers=team["sc_auth"],
        json={"status": "COMPLETED"},
    )
    assert missing_photo.status_code == 400, missing_photo.text

    closed = await client.patch(
        f"/api/v1/visits/{visit_id}",
        headers=team["sc_auth"],
        json={"status": "COMPLETED", "proof_photo": PROOF},
    )
    assert closed.status_code == 200, closed.text
    assert closed.json()["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_diet_plan_admin_close_requires_photo(client):
    team = await setup_team(client)
    service_id = await service_id_by_slug(client, team["senior"], "personalised-diet-plan")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Need a diet plan"},
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]

    companion_close = await client.patch(
        f"/api/v1/services/requests/{request_id}",
        headers=team["companion_auth"],
        json={"status": "COMPLETED", "proof_photo": PROOF},
    )
    assert companion_close.status_code == 403, companion_close.text

    missing_photo = await client.patch(
        f"/api/v1/services/requests/{request_id}",
        headers=team["admin"],
        json={"status": "COMPLETED"},
    )
    assert missing_photo.status_code == 400, missing_photo.text

    closed = await client.patch(
        f"/api/v1/services/requests/{request_id}",
        headers=team["admin"],
        json={"status": "COMPLETED", "proof_photo": PROOF},
    )
    assert closed.status_code == 200, closed.text
    assert closed.json()["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_home_repair_companion_closes_with_photo(client):
    team = await setup_team(client)
    service_id = await service_id_by_slug(client, team["senior"], "home-repair")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Tap leak"},
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]

    admin_close = await client.patch(
        f"/api/v1/services/requests/{request_id}",
        headers=team["admin"],
        json={"status": "COMPLETED", "proof_photo": PROOF},
    )
    assert admin_close.status_code == 403, admin_close.text

    missing_photo = await client.patch(
        f"/api/v1/services/requests/{request_id}",
        headers=team["companion_auth"],
        json={"status": "COMPLETED"},
    )
    assert missing_photo.status_code == 400, missing_photo.text

    closed = await client.patch(
        f"/api/v1/services/requests/{request_id}",
        headers=team["companion_auth"],
        json={"status": "COMPLETED", "proof_photo": PROOF},
    )
    assert closed.status_code == 200, closed.text
    assert closed.json()["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_emergency_companion_cannot_resolve_and_photo_required(client):
    team = await setup_team(client)
    await activate_membership(client, team["senior"], team["admin"])
    area = await client.patch(
        f"/api/v1/seniors/{team['senior_id']}",
        headers=team["admin"],
        json={"in_service_area": True, "address": "Kandivali West"},
    )
    assert area.status_code == 200, area.text
    when = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    for assignee in (team["cm"]["id"], team["companion"]["id"]):
        visit = await client.post(
            "/api/v1/visits/",
            headers=team["admin"],
            json={
                "senior_id": team["senior_id"],
                "care_manager_id": assignee,
                "service_slug": "emergency-sos",
                "status": "SCHEDULED",
                "scheduled_at": when,
                "notes": "SOS coverage",
            },
        )
        assert visit.status_code == 200, visit.text

    created = await client.post("/api/v1/emergency/", headers=team["senior"], json={"type": "MEDICAL"})
    assert created.status_code == 200, created.text
    case_id = created.json()["id"]

    companion_close = await client.patch(
        f"/api/v1/emergency/{case_id}/report",
        headers=team["companion_auth"],
        json={"what_happened": "Fall", "action_taken": "Attended", "mark_resolved": True, "proof_photo": PROOF},
    )
    assert companion_close.status_code == 403, companion_close.text

    missing_photo = await client.patch(
        f"/api/v1/emergency/{case_id}/report",
        headers=team["cm_auth"],
        json={"what_happened": "Fall", "action_taken": "Attended", "mark_resolved": True},
    )
    assert missing_photo.status_code == 400, missing_photo.text

    closed = await client.patch(
        f"/api/v1/emergency/{case_id}/report",
        headers=team["cm_auth"],
        json={
            "what_happened": "Fall",
            "action_taken": "Attended and coordinated support",
            "mark_resolved": True,
            "proof_photo": PROOF,
        },
    )
    assert closed.status_code == 200, closed.text
    assert closed.json()["status"] == "RESOLVED"


@pytest.mark.asyncio
async def test_admin_assigns_grocery_to_service_companion(client):
    team = await setup_team(client)
    service_id = await service_id_by_slug(client, team["senior"], "grocery")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Typed grocery list:\nMilk"},
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]

    listed = await client.get(
        "/api/v1/services/requests",
        headers=team["admin"],
        params={"service_slug": "grocery"},
    )
    assert listed.status_code == 200, listed.text
    match = next(item for item in listed.json()["items"] if item["id"] == request_id)
    assert match["service_slug"] == "grocery"
    assert match["senior_name"]

    before = await client.get("/api/v1/services/requests/unassigned-counts", headers=team["admin"])
    assert before.status_code == 200, before.text
    assert before.json().get("grocery", 0) >= 1

    soft = await client.post(
        f"/api/v1/services/requests/{request_id}/assign",
        headers=team["admin"],
        json={"care_manager_id": team["cm"]["id"]},
    )
    assert soft.status_code == 200, soft.text
    assert soft.json()["awaiting_dispatch"] is True
    assert soft.json()["dispatcher_id"] == team["cm"]["id"]

    assigned = await client.post(
        f"/api/v1/services/requests/{request_id}/assign",
        headers=team["admin"],
        json={"care_manager_id": team["sc"]["id"]},
    )
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["status"] == "ASSIGNED"
    assert assigned.json()["executor_id"] == team["sc"]["id"]
    assert assigned.json()["awaiting_dispatch"] is False

    after = await client.get("/api/v1/services/requests/unassigned-counts", headers=team["admin"])
    assert after.status_code == 200, after.text
    assert after.json().get("grocery", 0) == before.json().get("grocery", 0) - 1

    deliveries = await client.get("/api/v1/deliveries/", headers=team["sc_auth"])
    assert deliveries.status_code == 200, deliveries.text
    grocery = next(item for item in deliveries.json()["items"] if item.get("service_request_id") == request_id)
    assert grocery["service_slug"] == "grocery"
    assert grocery["status"] == "PENDING"
    assert grocery["request_notes"] == "Typed grocery list:\nMilk"
    assert grocery.get("list_photo") in (None, "")

    point = {
        "latitude": "19.2100",
        "longitude": "72.8500",
        "timestamp": "2026-08-21T12:00:00",
    }
    dedicated = await client.post(
        f"/api/v1/tracking/deliveries/{grocery['id']}/executive/points",
        headers=team["sc_auth"],
        json=point,
    )
    assert dedicated.status_code == 200, dedicated.text
    fallback = await client.post(
        f"/api/v1/tracking/{grocery['id']}/points",
        headers=team["sc_auth"],
        json={**point, "latitude": "19.2110", "timestamp": "2026-08-21T12:01:00"},
    )
    assert fallback.status_code == 200, fallback.text
    latest = await client.get(
        f"/api/v1/tracking/deliveries/{grocery['id']}/executive/latest",
        headers=team["senior"],
    )
    assert latest.status_code == 200, latest.text
    assert latest.json()["latitude"] == "19.2110"
    blocked_cm = await client.post(
        f"/api/v1/tracking/deliveries/{grocery['id']}/executive/points",
        headers=team["cm_auth"],
        json=point,
    )
    assert blocked_cm.status_code == 403, blocked_cm.text


@pytest.mark.asyncio
async def test_admin_cannot_assign_desk_diet_plan(client):
    team = await setup_team(client)
    service_id = await service_id_by_slug(client, team["senior"], "personalised-diet-plan")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Diet"},
    )
    assert created.status_code == 200, created.text
    blocked = await client.post(
        f"/api/v1/services/requests/{created.json()['id']}/assign",
        headers=team["admin"],
        json={"care_manager_id": team["cm"]["id"]},
    )
    assert blocked.status_code == 400, blocked.text


@pytest.mark.asyncio
async def test_care_manager_assigns_companion_and_cannot_assign_cm(client):
    team = await setup_team(client)
    await activate_membership(client, team["senior"], team["admin"])
    service_id = await service_id_by_slug(client, team["senior"], "companion")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Walk"},
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]

    assignable = await client.get("/api/v1/care/", headers=team["cm_auth"], params={"for_assign": True})
    assert assignable.status_code == 200, assignable.text
    ids = {item["id"] for item in assignable.json()}
    assert team["companion"]["id"] in ids
    assert team["sc"]["id"] in ids
    assert team["cm"]["id"] not in ids

    blocked_self = await client.post(
        f"/api/v1/services/requests/{request_id}/assign",
        headers=team["cm_auth"],
        json={"care_manager_id": team["cm"]["id"]},
    )
    assert blocked_self.status_code == 403, blocked_self.text

    blocked_companion_actor = await client.post(
        f"/api/v1/services/requests/{request_id}/assign",
        headers=team["companion_auth"],
        json={"care_manager_id": team["companion"]["id"]},
    )
    assert blocked_companion_actor.status_code == 403, blocked_companion_actor.text

    assigned = await client.post(
        f"/api/v1/services/requests/{request_id}/assign",
        headers=team["cm_auth"],
        json={"care_manager_id": team["companion"]["id"]},
    )
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["status"] == "ASSIGNED"


@pytest.mark.asyncio
async def test_auto_assigns_standing_companion_for_health_check(client):
    team = await setup_team(client)
    await activate_membership(client, team["senior"], team["admin"])
    linked = await client.patch(
        f"/api/v1/seniors/{team['senior_id']}",
        headers=team["admin"],
        json={"care_manager_id": team["cm"]["id"], "companion_id": team["companion"]["id"]},
    )
    assert linked.status_code == 200, linked.text

    service_id = await service_id_by_slug(client, team["senior"], "health-check")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "BP check"},
    )
    assert created.status_code == 200, created.text
    assert created.json()["status"] == "ASSIGNED"

    visits = await client.get("/api/v1/visits/", headers=team["admin"], params={"senior_id": team["senior_id"]})
    assert visits.status_code == 200, visits.text
    assignees = {
        item["care_manager_id"]
        for item in visits.json()["items"]
        if item.get("service_slug") == "health-check"
    }
    assert team["cm"]["id"] in assignees
    assert team["companion"]["id"] in assignees


@pytest.mark.asyncio
async def test_admin_auto_assign_endpoint_routes_standing_without_confirm(client):
    """Existing REQUESTED rows (created before standing was linked) auto-assign on one tap."""
    team = await setup_team(client)
    await activate_membership(client, team["senior"], team["admin"])
    service_id = await service_id_by_slug(client, team["senior"], "health-check")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Late link"},
    )
    assert created.status_code == 200, created.text
    assert created.json()["status"] == "REQUESTED"
    request_id = created.json()["id"]

    linked = await client.patch(
        f"/api/v1/seniors/{team['senior_id']}",
        headers=team["admin"],
        json={"care_manager_id": team["cm"]["id"], "companion_id": team["companion"]["id"]},
    )
    assert linked.status_code == 200, linked.text

    auto = await client.post(
        f"/api/v1/services/requests/{request_id}/auto-assign",
        headers=team["admin"],
    )
    assert auto.status_code == 200, auto.text
    assert auto.json()["status"] == "ASSIGNED"
    assert auto.json()["executor_id"] in {team["cm"]["id"], team["companion"]["id"]}


@pytest.mark.asyncio
async def test_grocery_auto_dispatches_to_standing_companion_then_sc(client):
    team = await setup_team(client)
    await activate_membership(client, team["senior"], team["admin"])
    linked = await client.patch(
        f"/api/v1/seniors/{team['senior_id']}",
        headers=team["admin"],
        json={"companion_id": team["companion"]["id"]},
    )
    assert linked.status_code == 200, linked.text

    service_id = await service_id_by_slug(client, team["senior"], "grocery")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Milk"},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    request_id = body["id"]
    # Soft-dispatch to standing Companion — no delivery yet.
    detail = await client.get(
        "/api/v1/services/requests",
        headers=team["admin"],
        params={"service_slug": "grocery"},
    )
    assert detail.status_code == 200, detail.text
    match = next(item for item in detail.json()["items"] if item["id"] == request_id)
    assert match["status"] == "ASSIGNED"
    assert match["awaiting_dispatch"] is True
    assert match["dispatch_mode"] == "assign_sc_only"
    assert match["dispatcher_id"] == team["companion"]["id"]
    assert match["executor_id"] is None

    deliveries = await client.get("/api/v1/deliveries/", headers=team["companion_auth"])
    assert deliveries.status_code == 200, deliveries.text
    assert not any(item.get("service_request_id") == request_id for item in deliveries.json()["items"])

    blocked_take = await client.post(
        f"/api/v1/services/requests/{request_id}/take",
        headers=team["companion_auth"],
    )
    assert blocked_take.status_code == 400, blocked_take.text

    handed = await client.post(
        f"/api/v1/services/requests/{request_id}/assign-service-companion",
        headers=team["companion_auth"],
        json={"care_manager_id": team["sc"]["id"]},
    )
    assert handed.status_code == 200, handed.text
    assert handed.json()["awaiting_dispatch"] is False
    assert handed.json()["executor_id"] == team["sc"]["id"]

    sc_deliveries = await client.get("/api/v1/deliveries/", headers=team["sc_auth"])
    assert sc_deliveries.status_code == 200, sc_deliveries.text
    assert any(item.get("service_request_id") == request_id for item in sc_deliveries.json()["items"])


@pytest.mark.asyncio
async def test_banking_take_or_assign_to_sc(client):
    team = await setup_team(client)
    await activate_membership(client, team["senior"], team["admin"])
    service_id = await service_id_by_slug(client, team["senior"], "banking-companion")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Bank visit"},
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]

    dispatched = await client.post(
        f"/api/v1/services/requests/{request_id}/assign",
        headers=team["admin"],
        json={"care_manager_id": team["companion"]["id"]},
    )
    assert dispatched.status_code == 200, dispatched.text
    assert dispatched.json()["dispatch_mode"] == "take_or_assign"
    assert dispatched.json()["awaiting_dispatch"] is True

    taken = await client.post(
        f"/api/v1/services/requests/{request_id}/take",
        headers=team["companion_auth"],
    )
    assert taken.status_code == 200, taken.text
    assert taken.json()["executor_id"] == team["companion"]["id"]
    assert taken.json()["awaiting_dispatch"] is False

    visits = await client.get("/api/v1/visits/", headers=team["companion_auth"])
    assert visits.status_code == 200, visits.text
    visit = next(
        item
        for item in visits.json()["items"]
        if item.get("service_slug") == "banking-companion"
        and item.get("care_manager_id") == team["companion"]["id"]
        and item.get("status") == "SCHEDULED"
    )

    # After Take, companion can still hand off from the visit (Assign to SC).
    blocked_again = await client.post(
        f"/api/v1/services/requests/{request_id}/assign-service-companion",
        headers=team["companion_auth"],
        json={"care_manager_id": team["sc"]["id"]},
    )
    assert blocked_again.status_code == 200, blocked_again.text
    assert blocked_again.json()["executor_id"] == team["sc"]["id"]

    # Visit path also works (Task Details → Assign to SC). Re-take then handoff via visit.
    # First request already handed off; create a second banking job.
    created2 = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "ATM help"},
    )
    assert created2.status_code == 200, created2.text
    request2 = created2.json()["id"]
    await client.post(
        f"/api/v1/services/requests/{request2}/assign",
        headers=team["admin"],
        json={"care_manager_id": team["companion"]["id"]},
    )
    await client.post(
        f"/api/v1/services/requests/{request2}/take",
        headers=team["companion_auth"],
    )
    visits2 = await client.get("/api/v1/visits/", headers=team["companion_auth"])
    visit2 = next(
        item
        for item in visits2.json()["items"]
        if item.get("service_slug") == "banking-companion"
        and item.get("care_manager_id") == team["companion"]["id"]
        and item.get("status") == "SCHEDULED"
        and item.get("notes") == "ATM help"
    )
    handed = await client.post(
        f"/api/v1/visits/{visit2['id']}/assign-service-companion",
        headers=team["companion_auth"],
        json={"care_manager_id": team["sc"]["id"]},
    )
    assert handed.status_code == 200, handed.text
    assert handed.json()["executor_id"] == team["sc"]["id"]

    # Original companion visit from first take should be cancelled after request-level handoff.
    refreshed = await client.get(f"/api/v1/visits/{visit['id']}", headers=team["companion_auth"])
    assert refreshed.status_code == 200, refreshed.text
    assert refreshed.json()["status"] == "CANCELLED"


@pytest.mark.asyncio
async def test_admin_multi_assign_care_manager_and_companion(client):
    team = await setup_team(client)
    await activate_membership(client, team["senior"], team["admin"])
    service_id = await service_id_by_slug(client, team["senior"], "health-check")
    created = await client.post(
        "/api/v1/services/requests",
        headers=team["senior"],
        json={"senior_id": team["senior_id"], "service_id": service_id, "notes": "Vitals"},
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]

    assigned = await client.post(
        f"/api/v1/services/requests/{request_id}/assign",
        headers=team["admin"],
        json={"care_manager_ids": [team["cm"]["id"], team["companion"]["id"]]},
    )
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["status"] == "ASSIGNED"

    visits = await client.get("/api/v1/visits/", headers=team["admin"], params={"senior_id": team["senior_id"]})
    assert visits.status_code == 200, visits.text
    assignees = {
        item["care_manager_id"]
        for item in visits.json()["items"]
        if item.get("service_slug") == "health-check"
    }
    assert team["cm"]["id"] in assignees
    assert team["companion"]["id"] in assignees
