"""Phase 4.8A family access contracts over FamilySeniorAccess."""

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
PASSWORD = "password123"

SENIOR_SCOPED_LISTS = [
    "/api/v1/visits/",
    "/api/v1/appointments/",
    "/api/v1/healthcare/medications",
    "/api/v1/healthcare/medication-schedules",
    "/api/v1/healthcare/medical-records",
    "/api/v1/healthcare/lab-results",
    "/api/v1/healthcare/documents",
    "/api/v1/healthcare/providers",
    "/api/v1/services/requests",
    "/api/v1/emergency/",
]


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


@pytest_asyncio.fixture
async def ids(client):
    senior = await login(client, SENIOR_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(senior2))).json()
    return {"john": john["id"], "jane": jane["id"]}


@pytest.mark.asyncio
async def test_family_login_succeeds(client):
    token = await login(client, FAMILY_EMAIL)
    assert token


@pytest.mark.asyncio
async def test_family_profile_returns_own_record(client):
    token = await login(client, FAMILY_EMAIL)
    response = await client.get("/api/v1/families/me", headers=auth_header(token))
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {
        "id",
        "user_id",
        "first_name",
        "last_name",
        "relationship",
        "requested_senior_reference",
        "created_at",
        "updated_at",
    }
    assert body["first_name"] == "Son"
    assert body["last_name"] == "Doe"
    assert body["user_id"]
    assert "hashed_password" not in body
    assert "photo" not in body


@pytest.mark.asyncio
async def test_authorized_senior_list_returns_only_senior_a(client, ids):
    token = await login(client, FAMILY_EMAIL)
    response = await client.get("/api/v1/families/seniors", headers=auth_header(token))
    assert response.status_code == 200
    seniors = response.json()
    assert isinstance(seniors, list)
    assert len(seniors) == 1
    senior = seniors[0]
    assert senior["id"] == ids["john"]
    assert senior["first_name"] == "John"
    assert senior["last_name"] == "Doe"
    assert set(senior.keys()) >= {
        "id",
        "user_id",
        "first_name",
        "last_name",
        "date_of_birth",
        "address",
        "emergency_contact",
    }
    assert ids["jane"] not in {item["id"] for item in seniors}
    assert "health_score" not in senior
    assert "safety_score" not in senior
    assert "mood" not in senior
    assert "photo" not in senior


@pytest.mark.asyncio
async def test_family_can_read_authorized_senior_profile(client, ids):
    token = await login(client, FAMILY_EMAIL)
    allowed = await client.get(f"/api/v1/seniors/{ids['john']}", headers=auth_header(token))
    denied = await client.get(f"/api/v1/seniors/{ids['jane']}", headers=auth_header(token))
    assert allowed.status_code == 200
    assert allowed.json()["id"] == ids["john"]
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_family_visits_authorized_and_unauthorized(client, ids):
    token = await login(client, FAMILY_EMAIL)
    allowed = await client.get(
        "/api/v1/visits/",
        headers=auth_header(token),
        params={"senior_id": ids["john"], "today": True},
    )
    denied = await client.get(
        "/api/v1/visits/",
        headers=auth_header(token),
        params={"senior_id": ids["jane"]},
    )
    missing = await client.get("/api/v1/visits/", headers=auth_header(token))
    assert allowed.status_code == 200
    payload = allowed.json()
    assert "items" in payload
    all_visits = await client.get(
        "/api/v1/visits/",
        headers=auth_header(token),
        params={"senior_id": ids["john"]},
    )
    assert all_visits.status_code == 200
    assert all_visits.json()["total"] >= 1
    visit = all_visits.json()["items"][0]
    assert visit["senior_id"] == ids["john"]
    assert set(visit.keys()) == {
        "id",
        "senior_id",
        "care_manager_id",
        "employee_id",
        "care_manager_name",
        "status",
        "scheduled_at",
        "notes",
    }
    assert visit["employee_id"] == "CM01"
    assert visit["care_manager_name"] == "Rohit Sharma"
    assert denied.status_code == 403
    assert missing.status_code == 403


@pytest.mark.asyncio
async def test_family_appointments_authorized_and_unauthorized(client, ids):
    token = await login(client, FAMILY_EMAIL)
    allowed = await client.get(
        "/api/v1/appointments/",
        headers=auth_header(token),
        params={"senior_id": ids["john"]},
    )
    denied = await client.get(
        "/api/v1/appointments/",
        headers=auth_header(token),
        params={"senior_id": ids["jane"]},
    )
    assert allowed.status_code == 200
    item = allowed.json()["items"][0]
    assert item["senior_id"] == ids["john"]
    assert set(item.keys()) == {"id", "senior_id", "doctor_id", "doctor_name", "status", "scheduled_at"}
    assert "hospital" not in item
    assert "location" not in item
    assert "specialty" not in item
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_family_medications_authorized_and_unauthorized(client, ids):
    token = await login(client, FAMILY_EMAIL)
    headers = auth_header(token)
    meds = await client.get(
        "/api/v1/healthcare/medications",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    schedules = await client.get(
        "/api/v1/healthcare/medication-schedules",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    denied = await client.get(
        "/api/v1/healthcare/medications",
        headers=headers,
        params={"senior_id": ids["jane"]},
    )
    assert meds.status_code == 200
    assert meds.json()["total"] >= 1
    assert "taken_today" not in meds.json()["items"][0]
    assert "adherence_percentage" not in meds.json()["items"][0]
    assert schedules.status_code == 200
    assert schedules.json()["total"] >= 1
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_family_health_records_labs_documents_providers(client, ids):
    token = await login(client, FAMILY_EMAIL)
    headers = auth_header(token)
    records = await client.get(
        "/api/v1/healthcare/medical-records",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    labs = await client.get(
        "/api/v1/healthcare/lab-results",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    documents = await client.get(
        "/api/v1/healthcare/documents",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    providers = await client.get(
        "/api/v1/healthcare/providers",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    jane_records = await client.get(
        "/api/v1/healthcare/medical-records",
        headers=headers,
        params={"senior_id": ids["jane"]},
    )
    assert records.status_code == 200
    assert records.json()["total"] >= 1
    assert all(item["senior_id"] == ids["john"] for item in records.json()["items"])
    assert labs.status_code == 200
    assert documents.status_code == 200
    assert providers.status_code == 200
    assert jane_records.status_code == 403
    for item in records.json()["items"]:
        assert "health_score" not in item


@pytest.mark.asyncio
async def test_family_services_and_membership(client, ids):
    token = await login(client, FAMILY_EMAIL)
    headers = auth_header(token)
    requests = await client.get(
        "/api/v1/services/requests",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    membership = await client.get(
        "/api/v1/memberships/current",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    usage = await client.get(
        "/api/v1/memberships/current/usage",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    jane_membership = await client.get(
        "/api/v1/memberships/current",
        headers=headers,
        params={"senior_id": ids["jane"]},
    )
    jane_requests = await client.get(
        "/api/v1/services/requests",
        headers=headers,
        params={"senior_id": ids["jane"]},
    )
    assert requests.status_code == 200
    assert requests.json()["total"] >= 1
    item = requests.json()["items"][0]
    assert item["senior_id"] == ids["john"]
    assert set(item.keys()) == {"id", "senior_id", "service_id", "service_name", "status"}
    assert "scheduled_at" not in item
    assert membership.status_code == 200
    assert membership.json()["plan_name"]
    assert "benefits" in membership.json()
    assert usage.status_code == 200
    assert usage.json()[0]["used"] == 1
    assert "remaining" in usage.json()[0]
    assert jane_membership.status_code == 403
    assert jane_requests.status_code == 403


@pytest.mark.asyncio
async def test_family_emergency_authorized_and_unauthorized(client, ids):
    token = await login(client, FAMILY_EMAIL)
    headers = auth_header(token)
    listed = await client.get(
        "/api/v1/emergency/",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    denied = await client.get(
        "/api/v1/emergency/",
        headers=headers,
        params={"senior_id": ids["jane"]},
    )
    missing = await client.get("/api/v1/emergency/", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
    case = listed.json()["items"][0]
    assert case["senior_id"] == ids["john"]
    detail = await client.get(f"/api/v1/emergency/{case['id']}", headers=headers)
    events = await client.get(f"/api/v1/emergency/{case['id']}/events", headers=headers)
    assert detail.status_code == 200
    assert events.status_code == 200
    assert denied.status_code == 403
    assert missing.status_code == 403


@pytest.mark.asyncio
async def test_family_notifications_are_user_scoped(client):
    family = await login(client, FAMILY_EMAIL)
    family2 = await login(client, FAMILY2_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    family_inbox = await client.get("/api/v1/notifications/", headers=auth_header(family))
    family2_inbox = await client.get("/api/v1/notifications/", headers=auth_header(family2))
    jane_inbox = await client.get("/api/v1/notifications/", headers=auth_header(senior2))
    assert family_inbox.status_code == 200
    assert family2_inbox.status_code == 200
    family_ids = {item["id"] for item in family_inbox.json()["items"]}
    family2_ids = {item["id"] for item in family2_inbox.json()["items"]}
    jane_ids = {item["id"] for item in jane_inbox.json()["items"]}
    assert family_ids.isdisjoint(family2_ids)
    assert family_ids.isdisjoint(jane_ids)
    assert all("user_id" not in item for item in family_inbox.json()["items"])


@pytest.mark.asyncio
async def test_family2_cannot_access_senior_a(client, ids):
    token = await login(client, FAMILY2_EMAIL)
    headers = auth_header(token)
    seniors = await client.get("/api/v1/families/seniors", headers=headers)
    assert seniors.status_code in {200, 404}
    if seniors.status_code == 200:
        assert ids["john"] not in {item["id"] for item in seniors.json()}
    profile = await client.get(f"/api/v1/seniors/{ids['john']}", headers=headers)
    assert profile.status_code == 403
    for path in SENIOR_SCOPED_LISTS:
        response = await client.get(path, headers=headers, params={"senior_id": ids["john"]})
        assert response.status_code == 403, path
    membership = await client.get(
        "/api/v1/memberships/current",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    usage = await client.get(
        "/api/v1/memberships/current/usage",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    assert membership.status_code == 403
    assert usage.status_code == 403


@pytest.mark.asyncio
async def test_family_endpoints_require_auth(client):
    assert (await client.get("/api/v1/families/me")).status_code == 401
    assert (await client.get("/api/v1/families/seniors")).status_code == 401
    assert (await client.get("/api/v1/visits/")).status_code == 401
    assert (await client.get("/api/v1/notifications/")).status_code == 401


@pytest.mark.asyncio
async def test_senior_and_care_manager_cannot_use_family_endpoints(client):
    senior = await login(client, SENIOR_EMAIL)
    care = await login(client, CARE_EMAIL)
    for token in (senior, care):
        me = await client.get("/api/v1/families/me", headers=auth_header(token))
        seniors = await client.get("/api/v1/families/seniors", headers=auth_header(token))
        assert me.status_code == 403
        assert seniors.status_code == 403


@pytest.mark.asyncio
async def test_admin_follows_staff_rules_not_family_endpoints(client, ids):
    admin = await login(client, ADMIN_EMAIL)
    headers = auth_header(admin)
    assert (await client.get("/api/v1/families/me", headers=headers)).status_code == 403
    assert (await client.get("/api/v1/families/seniors", headers=headers)).status_code == 403
    visits = await client.get(
        "/api/v1/visits/",
        headers=headers,
        params={"senior_id": ids["john"]},
    )
    emergency = await client.get("/api/v1/emergency/", headers=headers)
    assert visits.status_code == 200
    assert emergency.status_code == 200


@pytest.mark.asyncio
async def test_family_openapi_real_schemas(client):
    spec = (await client.get("/openapi.json")).json()
    paths = spec["paths"]
    assert "/api/v1/families/" in paths
    assert "get" in paths["/api/v1/families/"]
    assert paths["/api/v1/families/"]["get"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert "get" in paths["/api/v1/families/me"]
    assert "get" in paths["/api/v1/families/seniors"]
    assert "securitySchemes" in spec["components"]
    schemas = spec["components"]["schemas"]
    assert "FamiliesResponse" not in schemas
    assert set(schemas["FamilyMemberResponse"]["properties"].keys()) == {
        "id",
        "user_id",
        "first_name",
        "last_name",
        "relationship",
        "requested_senior_reference",
        "created_at",
        "updated_at",
    }
    assert "SeniorResponse" in schemas
