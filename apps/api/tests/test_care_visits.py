from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.timezone import APP_TIMEZONE_NAME, app_local_date, today_in_app_timezone
from app.main import app

SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
FAMILY_EMAIL = "family@example.com"
FAMILY2_EMAIL = "family2@example.com"
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
async def test_timezone_boundary_dates():
    previous_day_utc = datetime(2026, 8, 19, 23, 30, tzinfo=timezone.utc)
    next_day_utc = datetime(2026, 8, 20, 0, 30, tzinfo=timezone.utc)
    still_previous_ist = datetime(2026, 8, 19, 18, 0, tzinfo=timezone.utc)
    assert APP_TIMEZONE_NAME == "Asia/Kolkata"
    assert app_local_date(previous_day_utc).isoformat() == "2026-08-20"
    assert app_local_date(next_day_utc).isoformat() == "2026-08-20"
    assert app_local_date(still_previous_ist).isoformat() == "2026-08-19"


@pytest.mark.asyncio
async def test_senior_can_get_own_visit(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)
    me = (await client.get("/api/v1/seniors/me", headers=headers)).json()
    listed = await client.get("/api/v1/visits/", headers=headers)
    assert listed.status_code == 200
    payload = listed.json()
    assert payload["total"] >= 1
    visit = payload["items"][0]
    assert visit["senior_id"] == me["id"]
    assert visit["care_manager_name"] == "Rohit Sharma"
    assert visit["employee_id"] == "CM01"
    assert visit["status"] == "SCHEDULED"
    assert "hashed_password" not in visit

    detail = await client.get(f"/api/v1/visits/{visit['id']}", headers=headers)
    assert detail.status_code == 200
    body = detail.json()
    assert body["id"] == visit["id"]
    assert body["care_manager_id"] == visit["care_manager_id"]
    assert body["care_manager_name"] == "Rohit Sharma"
    assert body["employee_id"] == "CM01"
    assert "scheduled_at" in body
    assert "notes" in body


@pytest.mark.asyncio
async def test_senior_cannot_get_another_senior_visit(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    listed = await client.get("/api/v1/visits/", headers=auth_header(token))
    visit_id = listed.json()["items"][0]["id"]

    cross = await client.get(
        "/api/v1/visits/",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert cross.status_code == 403

    other_detail = await client.get(f"/api/v1/visits/{visit_id}", headers=auth_header(other_token))
    assert other_detail.status_code == 403


@pytest.mark.asyncio
async def test_family_authorized_and_unauthorized_visit_access(client):
    family = await login(client, FAMILY_EMAIL)
    family2 = await login(client, FAMILY2_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(senior2))).json()
    visit_id = (await client.get("/api/v1/visits/", headers=auth_header(senior))).json()["items"][0]["id"]

    allowed = await client.get(
        "/api/v1/visits/",
        headers=auth_header(family),
        params={"senior_id": me["id"]},
    )
    assert allowed.status_code == 200
    assert allowed.json()["items"][0]["id"] == visit_id

    detail = await client.get(f"/api/v1/visits/{visit_id}", headers=auth_header(family))
    assert detail.status_code == 200

    denied_list = await client.get(
        "/api/v1/visits/",
        headers=auth_header(family),
        params={"senior_id": other["id"]},
    )
    assert denied_list.status_code == 403

    denied_family2 = await client.get(
        f"/api/v1/visits/{visit_id}",
        headers=auth_header(family2),
    )
    assert denied_family2.status_code == 403


@pytest.mark.asyncio
async def test_care_manager_assigned_and_unassigned_access(client):
    care = await login(client, CARE_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(senior2))).json()
    visit_id = (await client.get("/api/v1/visits/", headers=auth_header(senior))).json()["items"][0]["id"]

    assigned = await client.get("/api/v1/visits/", headers=auth_header(care))
    assert assigned.status_code == 200
    assert assigned.json()["total"] >= 1
    assert all(item["care_manager_name"] == "Rohit Sharma" for item in assigned.json()["items"])
    assert all(item["senior_id"] == me["id"] for item in assigned.json()["items"])

    detail = await client.get(f"/api/v1/visits/{visit_id}", headers=auth_header(care))
    assert detail.status_code == 200

    unassigned = await client.get(
        "/api/v1/visits/",
        headers=auth_header(care),
        params={"senior_id": other["id"]},
    )
    assert unassigned.status_code == 403


@pytest.mark.asyncio
async def test_visits_require_auth(client):
    senior = await login(client, SENIOR_EMAIL)
    visit_id = (await client.get("/api/v1/visits/", headers=auth_header(senior))).json()["items"][0]["id"]
    assert (await client.get("/api/v1/visits/")).status_code == 401
    assert (await client.get(f"/api/v1/visits/{visit_id}")).status_code == 401
    assert (await client.get(f"/api/v1/visits/{visit_id}/tasks")).status_code == 401
    assert (await client.get(f"/api/v1/visits/{visit_id}/reports")).status_code == 401
    assert (await client.get("/api/v1/care/")).status_code == 401


@pytest.mark.asyncio
async def test_visit_tasks_and_reports_real_data(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)
    visit_id = (await client.get("/api/v1/visits/", headers=headers)).json()["items"][0]["id"]

    tasks = await client.get(f"/api/v1/visits/{visit_id}/tasks", headers=headers)
    assert tasks.status_code == 200
    task = tasks.json()[0]
    assert task["visit_id"] == visit_id
    assert task["task_name"] == "Check vitals"
    assert task["is_completed"] is True

    reports = await client.get(f"/api/v1/visits/{visit_id}/reports", headers=headers)
    assert reports.status_code == 200
    report = reports.json()[0]
    assert report["visit_id"] == visit_id
    assert report["summary"] == "All good"
    assert report["issues_noted"] == "None"


@pytest.mark.asyncio
async def test_unauthorized_tasks_and_reports_forbidden(client):
    owner = await login(client, SENIOR_EMAIL)
    other = await login(client, SENIOR2_EMAIL)
    visit_id = (await client.get("/api/v1/visits/", headers=auth_header(owner))).json()["items"][0]["id"]
    assert (await client.get(f"/api/v1/visits/{visit_id}/tasks", headers=auth_header(other))).status_code == 403
    assert (await client.get(f"/api/v1/visits/{visit_id}/reports", headers=auth_header(other))).status_code == 403


@pytest.mark.asyncio
async def test_care_manager_profile_and_visibility(client):
    senior = await login(client, SENIOR_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    family = await login(client, FAMILY_EMAIL)
    care = await login(client, CARE_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(senior2))).json()

    own = await client.get("/api/v1/care/", headers=auth_header(care))
    assert own.status_code == 200
    assert len(own.json()) == 1
    profile = own.json()[0]
    assert profile["employee_id"] == "CM01"
    assert profile["name"] == "Rohit Sharma"
    assert profile["skills"] == "Nursing"
    assert profile["status"] == "ACTIVE"
    assert profile["user_id"]
    assert set(profile.keys()) >= {"id", "user_id", "employee_id", "name", "first_name", "last_name", "skills", "status"}

    associated = await client.get("/api/v1/care/", headers=auth_header(senior))
    assert associated.status_code == 200
    assert [item["name"] for item in associated.json()] == ["Rohit Sharma"]

    family_view = await client.get(
        "/api/v1/care/",
        headers=auth_header(family),
        params={"senior_id": me["id"]},
    )
    assert family_view.status_code == 200
    assert [item["employee_id"] for item in family_view.json()] == ["CM01"]

    family_denied = await client.get(
        "/api/v1/care/",
        headers=auth_header(family),
        params={"senior_id": other["id"]},
    )
    assert family_denied.status_code == 403

    unrelated = await client.get("/api/v1/care/", headers=auth_header(senior2))
    assert unrelated.status_code == 200
    assert unrelated.json() == []


@pytest.mark.asyncio
async def test_unknown_visit_not_found(client):
    token = await login(client, SENIOR_EMAIL)
    missing = "00000000-0000-0000-0000-000000000001"
    assert (await client.get(f"/api/v1/visits/{missing}", headers=auth_header(token))).status_code == 404
    assert (await client.get(f"/api/v1/visits/{missing}/tasks", headers=auth_header(token))).status_code == 404
    assert (await client.get(f"/api/v1/visits/{missing}/reports", headers=auth_header(token))).status_code == 404


@pytest.mark.asyncio
async def test_today_upcoming_and_pagination(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)

    ist_day = await client.get("/api/v1/visits/", headers=headers, params={"date": "2026-08-20"})
    assert ist_day.status_code == 200
    assert ist_day.json()["total"] >= 1
    assert all(item["scheduled_at"].startswith("2026-08-19T23:") for item in ist_day.json()["items"])

    previous_ist_day = await client.get("/api/v1/visits/", headers=headers, params={"date": "2026-08-19"})
    assert previous_ist_day.status_code == 200
    assert previous_ist_day.json()["items"] == []

    if today_in_app_timezone().isoformat() == "2026-08-20":
        live_today = await client.get("/api/v1/visits/", headers=headers, params={"today": True})
        assert live_today.status_code == 200
        assert live_today.json()["total"] >= 1

    upcoming = await client.get("/api/v1/visits/", headers=headers, params={"upcoming": True})
    assert upcoming.status_code == 200
    for item in upcoming.json()["items"]:
        assert item["scheduled_at"] >= datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    page = await client.get("/api/v1/visits/", headers=headers, params={"limit": 1, "offset": 0})
    assert page.status_code == 200
    assert page.json()["limit"] == 1
    assert len(page.json()["items"]) == 1
    assert page.json()["total"] >= 1
    page2 = await client.get("/api/v1/visits/", headers=headers, params={"limit": 1, "offset": 1})
    assert page2.status_code == 200
    assert page2.json()["offset"] == 1
    assert len(page2.json()["items"]) == 0 or page.json()["items"][0]["id"] != page2.json()["items"][0]["id"]


@pytest.mark.asyncio
async def test_openapi_care_visit_contracts(client):
    spec = (await client.get("/openapi.json")).json()
    paths = spec["paths"]
    for path in (
        "/api/v1/visits/",
        "/api/v1/visits/{visit_id}",
        "/api/v1/visits/{visit_id}/tasks",
        "/api/v1/visits/{visit_id}/reports",
        "/api/v1/care/",
    ):
        assert path in paths
        assert "get" in paths[path]

    schemas = spec["components"]["schemas"]
    assert "VisitResponse" in schemas
    assert set(schemas["VisitResponse"]["properties"]) >= {
        "id",
        "senior_id",
        "care_manager_id",
        "employee_id",
        "care_manager_name",
        "status",
        "scheduled_at",
        "notes",
    }
    assert "VisitTaskResponse" in schemas
    assert set(schemas["VisitTaskResponse"]["properties"]) >= {"id", "visit_id", "task_name", "is_completed"}
    assert "VisitReportResponse" in schemas
    assert set(schemas["VisitReportResponse"]["properties"]) >= {"id", "visit_id", "summary", "issues_noted"}
    assert "CareManagerResponse" in schemas
    assert set(schemas["CareManagerResponse"]["properties"]) >= {
        "id",
        "user_id",
        "employee_id",
        "name",
        "first_name",
        "last_name",
        "skills",
        "status",
    }
    assert "CareResponse" not in schemas
    care_schema = paths["/api/v1/care/"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert care_schema["items"]["$ref"].endswith("CareManagerResponse")
