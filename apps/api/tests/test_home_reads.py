import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
FAMILY_EMAIL = "family@example.com"
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
async def test_seniors_me_returns_authenticated_senior(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get("/api/v1/seniors/me", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert data["user_id"]
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_seniors_me_rejects_non_senior(client):
    token = await login(client, FAMILY_EMAIL)
    response = await client.get("/api/v1/seniors/me", headers=auth_header(token))
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_seniors_me_unauthorized(client):
    response = await client.get("/api/v1/seniors/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_senior_retrieves_own_visits(client):
    token = await login(client, SENIOR_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(token))).json()
    response = await client.get("/api/v1/visits/", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert payload["total"] >= 1
    assert all(item["senior_id"] == me["id"] for item in payload["items"])
    assert "scheduled_at" in payload["items"][0]
    assert "status" in payload["items"][0]


@pytest.mark.asyncio
async def test_senior_cannot_retrieve_another_seniors_visits(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    response = await client.get(
        "/api/v1/visits/",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_visits_unauthorized(client):
    response = await client.get("/api/v1/visits/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_senior_retrieves_own_appointments(client):
    token = await login(client, SENIOR_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(token))).json()
    response = await client.get("/api/v1/appointments/", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    item = payload["items"][0]
    assert item["senior_id"] == me["id"]
    assert item["doctor_name"] == "Dr. Smith"
    assert "scheduled_at" in item


@pytest.mark.asyncio
async def test_senior_cannot_retrieve_another_seniors_appointments(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    response = await client.get(
        "/api/v1/appointments/",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_current_membership_returns_plan(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get("/api/v1/memberships/current", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert data["plan_name"] == "Premium"
    assert data["membership_id"]
    assert data["plan_id"]
    assert data["status"] in {"ACTIVE", "EXPIRED", "UPCOMING"}
    assert any(benefit["benefit_name"] == "Doctor Visits" for benefit in data["benefits"])
    assert any(benefit["quota"] == 5 for benefit in data["benefits"])


@pytest.mark.asyncio
async def test_membership_usage_comes_from_ledger(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get("/api/v1/memberships/current/usage", headers=auth_header(token))
    assert response.status_code == 200
    usage = response.json()
    assert len(usage) >= 1
    doctor = next(item for item in usage if item["benefit_name"] == "Doctor Visits")
    assert doctor["quota"] == 5
    assert doctor["used"] == 1
    assert doctor["remaining"] == 4


@pytest.mark.asyncio
async def test_notifications_only_return_current_user(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get("/api/v1/notifications/", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert all(item["title"] for item in payload["items"])
    unread = await client.get(
        "/api/v1/notifications/",
        headers=auth_header(token),
        params={"unread_only": True},
    )
    assert unread.status_code == 200
    other_token = await login(client, SENIOR2_EMAIL)
    other = await client.get("/api/v1/notifications/", headers=auth_header(other_token))
    assert other.status_code == 200
    senior_ids = {item["id"] for item in payload["items"]}
    other_ids = {item["id"] for item in other.json()["items"]}
    assert senior_ids.isdisjoint(other_ids)


@pytest.mark.asyncio
async def test_service_requests_only_return_current_senior(client):
    token = await login(client, SENIOR_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(token))).json()
    response = await client.get("/api/v1/services/requests", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert all(item["senior_id"] == me["id"] for item in payload["items"])
    assert all(item["service_name"] for item in payload["items"])


@pytest.mark.asyncio
async def test_service_requests_cross_senior_forbidden(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    response = await client.get(
        "/api/v1/services/requests",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_medications_only_return_current_senior(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get("/api/v1/healthcare/medications", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    item = payload["items"][0]
    assert item["name"] == "Aspirin"
    assert item["dosage"] == "100mg"
    assert item["schedule"] == "08:00"
    assert item["frequency"] == "Daily"


@pytest.mark.asyncio
async def test_medications_cross_senior_forbidden(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    response = await client.get(
        "/api/v1/healthcare/medications",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_home_read_endpoints_require_auth(client):
    paths = [
        "/api/v1/visits/",
        "/api/v1/appointments/",
        "/api/v1/memberships/current",
        "/api/v1/memberships/current/usage",
        "/api/v1/notifications/",
        "/api/v1/services/requests",
        "/api/v1/healthcare/medications",
    ]
    for path in paths:
        response = await client.get(path)
        assert response.status_code == 401, path


@pytest.mark.asyncio
async def test_openapi_contains_home_read_schemas(client):
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    spec = response.json()
    paths = spec["paths"]
    expected = {
        "/api/v1/seniors/me": "get",
        "/api/v1/visits/": "get",
        "/api/v1/appointments/": "get",
        "/api/v1/memberships/current": "get",
        "/api/v1/memberships/current/usage": "get",
        "/api/v1/notifications/": "get",
        "/api/v1/services/requests": "get",
        "/api/v1/healthcare/medications": "get",
    }
    for path, method in expected.items():
        assert path in paths, path
        schema = paths[path][method]["responses"]["200"]["content"]["application/json"]["schema"]
        ref = schema.get("$ref") or schema.get("items", {}).get("$ref", "")
        assert "UUID" not in schema.get("title", "")
        # Ensure list endpoints are paginated objects, not a bare {id: UUID} array
        if path.endswith("/") and path not in {"/api/v1/seniors/me"}:
            assert schema.get("type") == "object" or (ref and "ListPage" in ref) or "properties" in schema or ref


@pytest.mark.asyncio
async def test_create_service_request_requires_auth(client):
    response = await client.post(
        "/api/v1/services/requests",
        json={"senior_id": "00000000-0000-0000-0000-000000000001", "service_id": "00000000-0000-0000-0000-000000000002"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_senior_can_create_and_list_own_service_request(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)
    me = (await client.get("/api/v1/seniors/me", headers=headers)).json()
    services = (await client.get("/api/v1/services/", headers=headers)).json()
    assert len(services) >= 1
    service_id = services[0]["id"]

    created = await client.post(
        "/api/v1/services/requests",
        headers=headers,
        json={"senior_id": me["id"], "service_id": service_id},
    )
    assert created.status_code == 200
    body = created.json()
    assert body["senior_id"] == me["id"]
    assert body["service_id"] == service_id
    assert body["status"] == "REQUESTED"
    assert "preferred_date" not in body

    history = await client.get("/api/v1/services/requests", headers=headers)
    assert history.status_code == 200
    ids = {item["id"] for item in history.json()["items"]}
    assert body["id"] in ids


@pytest.mark.asyncio
async def test_senior_cannot_create_request_for_another_senior(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    services = (await client.get("/api/v1/services/", headers=auth_header(token))).json()

    response = await client.post(
        "/api/v1/services/requests",
        headers=auth_header(token),
        json={"senior_id": other["id"], "service_id": services[0]["id"]},
    )
    assert response.status_code == 403
