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

ADMIN_WRITE_PATHS = [
    ("post", "/api/v1/users/", {"email": "x@example.com", "phone": "000", "role": "SENIOR", "password": "password123"}),
    ("get", "/api/v1/users/", None),
    ("get", "/api/v1/users/00000000-0000-0000-0000-000000000001", None),
    ("get", "/api/v1/seniors/", None),
    ("post", "/api/v1/seniors/", {
        "first_name": "A",
        "last_name": "B",
        "date_of_birth": "1940-01-01",
        "address": "x",
        "emergency_contact": "x",
        "user_id": "00000000-0000-0000-0000-000000000001",
    }),
    ("post", "/api/v1/services/", {"name": "X", "category": "HEALTH", "description": "x"}),
    ("get", "/api/v1/families/", None),
    ("get", "/api/v1/access/", None),
    ("get", "/api/v1/memberships/plans", None),
    ("get", "/api/v1/notifications/admin", None),
    ("get", "/api/v1/audit/", None),
    ("get", "/api/v1/orders/", None),
    ("get", "/api/v1/payments/", None),
    ("get", "/api/v1/addons/", None),
    ("get", "/api/v1/documents/", None),
]


def call(client, method, path, headers=None, body=None):
    kwargs = {}
    if headers:
        kwargs["headers"] = headers
    if method in {"post", "patch", "put"} and body is not None:
        kwargs["json"] = body
    return getattr(client, method)(path, **kwargs)


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


def assert_no_secrets(payload):
    text = str(payload)
    assert "hashed_password" not in text
    assert "JWT_SECRET" not in text
    assert "password_hash" not in text


@pytest.mark.asyncio
async def test_admin_endpoints_require_auth(client):
    for method, path, body in ADMIN_WRITE_PATHS:
        response = await call(client, method, path, body=body)
        assert response.status_code == 401, path


@pytest.mark.asyncio
async def test_non_staff_cannot_use_admin_endpoints(client):
    for email in (SENIOR_EMAIL, FAMILY_EMAIL, CARE_EMAIL):
        token = await login(client, email)
        headers = auth_header(token)
        for method, path, body in ADMIN_WRITE_PATHS:
            response = await call(client, method, path, headers=headers, body=body)
            assert response.status_code == 403, f"{email} {method} {path} -> {response.status_code}"


@pytest.mark.asyncio
async def test_admin_user_directory_and_patch(client):
    token = await login(client, ADMIN_EMAIL)
    headers = auth_header(token)
    listing = await client.get("/api/v1/users/", headers=headers, params={"limit": 10, "offset": 0})
    assert listing.status_code == 200
    body = listing.json()
    assert body["total"] >= 6
    assert "items" in body
    assert_no_secrets(body)
    emails = {item["email"] for item in body["items"]}
    assert ADMIN_EMAIL in emails
    filtered = await client.get("/api/v1/users/", headers=headers, params={"role": "ADMIN", "email": "admin@"})
    assert filtered.status_code == 200
    assert all(item["role"] == "ADMIN" for item in filtered.json()["items"])

    suffix = uuid.uuid4().hex[:8]
    created = await client.post(
        "/api/v1/users/",
        headers=headers,
        json={
            "email": f"staff-{suffix}@example.com",
            "phone": f"9{suffix[:9]}",
            "role": "FAMILY",
            "password": "password123",
        },
    )
    assert created.status_code == 200, created.text
    user = created.json()
    assert user["role"] == "FAMILY"
    assert "hashed_password" not in user
    assert "password" not in user

    detail = await client.get(f"/api/v1/users/{user['id']}", headers=headers)
    assert detail.status_code == 200
    assert_no_secrets(detail.json())

    patched = await client.patch(
        f"/api/v1/users/{user['id']}",
        headers=headers,
        json={"role": "SENIOR"},
    )
    assert patched.status_code == 200
    assert patched.json()["role"] == "SENIOR"

    invalid = await client.patch(
        f"/api/v1/users/{user['id']}",
        headers=headers,
        json={"role": "SUPERUSER"},
    )
    assert invalid.status_code == 422


@pytest.mark.asyncio
async def test_admin_senior_and_family_directories(client):
    token = await login(client, ADMIN_EMAIL)
    headers = auth_header(token)
    seniors = await client.get("/api/v1/seniors/", headers=headers)
    assert seniors.status_code == 200
    payload = seniors.json()
    assert payload["total"] >= 2
    assert {item["first_name"] for item in payload["items"]} >= {"John", "Jane"}
    assert_no_secrets(payload)
    assert all("email" in item for item in payload["items"])

    families = await client.get("/api/v1/families/", headers=headers)
    assert families.status_code == 200
    assert families.json()["total"] >= 1
    family = families.json()["items"][0]
    assert set(family) >= {"id", "user_id", "first_name", "last_name", "created_at", "updated_at"}
    assert_no_secrets(family)

    me = await client.get("/api/v1/families/me", headers=headers)
    assert me.status_code == 403


@pytest.mark.asyncio
async def test_family_senior_access_management_and_isolation(client):
    admin = await login(client, ADMIN_EMAIL)
    family = await login(client, FAMILY_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    admin_h = auth_header(admin)
    family_h = auth_header(family)

    john = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(senior2))).json()
    families = (await client.get("/api/v1/families/", headers=admin_h)).json()["items"]
    family_id = families[0]["id"]

    before = await client.get("/api/v1/families/seniors", headers=family_h)
    assert before.status_code == 200
    assert jane["id"] not in {item["id"] for item in before.json()}

    created = await client.post(
        "/api/v1/access/",
        headers=admin_h,
        json={"family_id": family_id, "senior_id": jane["id"]},
    )
    assert created.status_code == 200, created.text
    access_id = created.json()["id"]
    assert created.json()["family_id"] == family_id
    assert created.json()["senior_id"] == jane["id"]
    assert "permission" not in created.json()

    duplicate = await client.post(
        "/api/v1/access/",
        headers=admin_h,
        json={"family_id": family_id, "senior_id": jane["id"]},
    )
    assert duplicate.status_code == 409

    after = await client.get("/api/v1/families/seniors", headers=family_h)
    assert jane["id"] in {item["id"] for item in after.json()}
    jane_visits = await client.get(
        "/api/v1/visits/",
        headers=family_h,
        params={"senior_id": jane["id"]},
    )
    assert jane_visits.status_code == 200

    deleted = await client.delete(f"/api/v1/access/{access_id}", headers=admin_h)
    assert deleted.status_code == 200

    restored = await client.get(
        "/api/v1/visits/",
        headers=family_h,
        params={"senior_id": jane["id"]},
    )
    assert restored.status_code == 403
    john_visits = await client.get(
        "/api/v1/visits/",
        headers=family_h,
        params={"senior_id": john["id"]},
    )
    assert john_visits.status_code == 200


@pytest.mark.asyncio
async def test_care_service_visit_emergency_membership_admin(client):
    admin = await login(client, ADMIN_EMAIL)
    care = await login(client, CARE_EMAIL)
    senior = await login(client, SENIOR_EMAIL)
    headers = auth_header(admin)
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(senior))).json()
    managers = (await client.get("/api/v1/care/", headers=headers)).json()
    assert len(managers) >= 1
    cm = managers[0]
    detail = await client.get(f"/api/v1/care/{cm['id']}", headers=headers)
    assert detail.status_code == 200
    assert "first_name" in detail.json()
    patched_cm = await client.patch(
        f"/api/v1/care/{cm['id']}",
        headers=headers,
        json={"skills": cm.get("skills") or "Nursing"},
    )
    assert patched_cm.status_code == 200

    catalogue = await client.get("/api/v1/services/", headers=headers)
    assert catalogue.status_code == 200
    service_id = catalogue.json()[0]["id"]
    updated_service = await client.patch(
        f"/api/v1/services/{service_id}",
        headers=headers,
        json={"description": "Test"},
    )
    assert updated_service.status_code == 200

    requests = await client.get("/api/v1/services/requests", headers=headers)
    assert requests.status_code == 200
    request_id = requests.json()["items"][0]["id"]
    original_status = requests.json()["items"][0]["status"]
    patched_req = await client.patch(
        f"/api/v1/services/requests/{request_id}",
        headers=headers,
        json={"status": "CONFIRMED"},
    )
    assert patched_req.status_code == 200
    assert patched_req.json()["status"] == "CONFIRMED"
    await client.patch(
        f"/api/v1/services/requests/{request_id}",
        headers=headers,
        json={"status": original_status},
    )

    visit = await client.post(
        "/api/v1/visits/",
        headers=headers,
        json={
            "senior_id": john["id"],
            "care_manager_id": cm["id"],
            "status": "SCHEDULED",
            "notes": "Admin assigned visit",
        },
    )
    assert visit.status_code == 200, visit.text
    visit_id = visit.json()["id"]
    assert visit.json()["care_manager_id"] == cm["id"]
    reassigned = await client.patch(
        f"/api/v1/visits/{visit_id}",
        headers=headers,
        json={"status": "CANCELLED", "notes": "Cancelled by admin"},
    )
    assert reassigned.status_code == 200
    assert reassigned.json()["status"] == "CANCELLED"

    care_sees = await client.get(f"/api/v1/visits/{visit_id}", headers=auth_header(care))
    assert care_sees.status_code == 200

    case = await client.post(
        "/api/v1/emergency/",
        headers=headers,
        json={"type": "AGEWELL_SUPPORT", "senior_id": john["id"]},
    )
    assert case.status_code == 200
    case_id = case.json()["id"]
    updated_case = await client.patch(
        f"/api/v1/emergency/{case_id}",
        headers=headers,
        json={"status": "ACKNOWLEDGED"},
    )
    assert updated_case.status_code == 200
    assert updated_case.json()["status"] == "ACKNOWLEDGED"
    events = await client.get(f"/api/v1/emergency/{case_id}/events", headers=headers)
    assert events.status_code == 200
    descriptions = [item["event_description"] for item in events.json()["items"]]
    assert any("ACKNOWLEDGED" in (text or "") for text in descriptions)
    assert all("Ambulance" not in (text or "") for text in descriptions)

    plans = await client.get("/api/v1/memberships/plans", headers=headers)
    benefits = await client.get("/api/v1/memberships/benefits", headers=headers)
    records = await client.get("/api/v1/memberships/records", headers=headers)
    assert plans.status_code == 200
    assert benefits.status_code == 200
    assert records.status_code == 200
    assert records.json()["items"][0]["status"] in {"ACTIVE", "EXPIRED", "UPCOMING"}
    usage = await client.get(
        "/api/v1/memberships/current/usage",
        headers=headers,
        params={"senior_id": john["id"]},
    )
    assert usage.status_code == 200
    assert set(usage.json()[0]) >= {"used", "quota", "remaining"}

    notes = await client.get("/api/v1/notifications/admin", headers=headers)
    assert notes.status_code == 200
    assert "total" in notes.json()
    assert_no_secrets(notes.json())


@pytest.mark.asyncio
async def test_care_manager_assignment_rules_unchanged(client):
    care = await login(client, CARE_EMAIL)
    senior2 = await login(client, SENIOR2_EMAIL)
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(senior2))).json()
    denied = await client.get(
        "/api/v1/visits/",
        headers=auth_header(care),
        params={"senior_id": jane["id"]},
    )
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_openapi_admin_contracts(client):
    spec = (await client.get("/openapi.json")).json()
    paths = spec["paths"]
    for path, method in (
        ("/api/v1/users/", "get"),
        ("/api/v1/users/", "post"),
        ("/api/v1/users/{user_id}", "get"),
        ("/api/v1/users/{user_id}", "patch"),
        ("/api/v1/seniors/", "get"),
        ("/api/v1/families/", "get"),
        ("/api/v1/access/", "get"),
        ("/api/v1/access/", "post"),
        ("/api/v1/access/{access_id}", "delete"),
        ("/api/v1/care/{care_manager_id}", "get"),
        ("/api/v1/care/", "post"),
        ("/api/v1/services/{service_id}", "patch"),
        ("/api/v1/services/requests/{request_id}", "patch"),
        ("/api/v1/visits/", "post"),
        ("/api/v1/visits/{visit_id}", "patch"),
        ("/api/v1/emergency/{emergency_id}", "patch"),
        ("/api/v1/memberships/plans", "get"),
        ("/api/v1/memberships/benefits", "get"),
        ("/api/v1/memberships/records", "get"),
        ("/api/v1/notifications/admin", "get"),
        ("/api/v1/audit/", "get"),
    ):
        assert path in paths, path
        assert method in paths[path], f"{method} {path}"
        operation = paths[path][method]
        assert operation.get("security") == [{"OAuth2PasswordBearer": []}]

    schemas = spec["components"]["schemas"]
    assert schemas["UserResponse"]["properties"].keys().isdisjoint({"hashed_password", "password"})
    assert set(schemas["FamilySeniorAccessResponse"]["properties"]) == {
        "id",
        "family_id",
        "senior_id",
        "created_at",
    }
    assert "AccessResponse" not in schemas or "family_id" in schemas.get("FamilySeniorAccessResponse", {}).get("properties", {})
    audit_schema = paths["/api/v1/audit/"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert audit_schema.get("$ref") or "ListPage" in str(audit_schema)
