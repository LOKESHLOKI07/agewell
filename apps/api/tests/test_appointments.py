"""Phase 4.10B appointment detail/create/update contracts."""

import uuid

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

APPOINTMENT_KEYS = {"id", "senior_id", "doctor_id", "doctor_name", "status", "scheduled_at"}
SCHEDULED_AT = "2026-09-15T10:00:00Z"
RESCHEDULED_AT = "2026-09-20T14:30:00Z"
UNKNOWN_ID = "00000000-0000-0000-0000-000000000099"


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def assert_appointment_shape(body: dict):
    assert set(body.keys()) == APPOINTMENT_KEYS
    assert "notes" not in body
    assert "location" not in body
    assert "hospital" not in body
    assert "duration" not in body
    assert "price" not in body
    assert "hashed_password" not in body


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
    appointments = (
        await client.get("/api/v1/appointments/", headers=auth_header(senior))
    ).json()
    doctor_id = appointments["items"][0]["doctor_id"]
    seed_appointment_id = appointments["items"][0]["id"]
    return {
        "john": john["id"],
        "jane": jane["id"],
        "doctor_id": doctor_id,
        "seed_appointment_id": seed_appointment_id,
        "senior": senior,
        "senior2": senior2,
    }


def create_body(ids, *, senior_id=None, doctor_id=None, scheduled_at=SCHEDULED_AT, status=None):
    payload = {
        "senior_id": senior_id if senior_id is not None else ids["john"],
        "doctor_id": doctor_id if doctor_id is not None else ids["doctor_id"],
        "scheduled_at": scheduled_at,
    }
    if status is not None:
        payload["status"] = status
    return payload


@pytest.mark.asyncio
async def test_senior_can_create_own_appointment(client, ids):
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(ids["senior"]),
        json=create_body(ids, senior_id=ids["john"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert_appointment_shape(body)
    assert body["senior_id"] == ids["john"]
    assert body["doctor_id"] == ids["doctor_id"]
    assert body["doctor_name"] == "Dr. Smith"
    assert body["status"] == "REQUESTED"


@pytest.mark.asyncio
async def test_senior_cannot_create_for_another_senior(client, ids):
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(ids["senior"]),
        json=create_body(ids, senior_id=ids["jane"]),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_family_can_create_for_authorized_senior(client, ids):
    token = await login(client, FAMILY_EMAIL)
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(token),
        json=create_body(ids, senior_id=ids["john"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert_appointment_shape(body)
    assert body["senior_id"] == ids["john"]
    assert body["status"] == "REQUESTED"


@pytest.mark.asyncio
async def test_family_cannot_create_for_unauthorized_senior(client, ids):
    token = await login(client, FAMILY_EMAIL)
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(token),
        json=create_body(ids, senior_id=ids["jane"]),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_family_create_without_senior_id_forbidden(client, ids):
    token = await login(client, FAMILY_EMAIL)
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(token),
        json={"doctor_id": ids["doctor_id"], "scheduled_at": SCHEDULED_AT},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_create_appointment(client, ids):
    token = await login(client, ADMIN_EMAIL)
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(token),
        json=create_body(ids, senior_id=ids["john"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert_appointment_shape(body)
    assert body["senior_id"] == ids["john"]
    assert body["status"] == "REQUESTED"


@pytest.mark.asyncio
async def test_care_manager_cannot_create_appointment(client, ids):
    token = await login(client, CARE_EMAIL)
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(token),
        json=create_body(ids, senior_id=ids["john"]),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_senior_can_retrieve_own_appointment_detail(client, ids):
    response = await client.get(
        f"/api/v1/appointments/{ids['seed_appointment_id']}",
        headers=auth_header(ids["senior"]),
    )
    assert response.status_code == 200
    body = response.json()
    assert_appointment_shape(body)
    assert body["id"] == ids["seed_appointment_id"]
    assert body["senior_id"] == ids["john"]
    assert body["doctor_name"] == "Dr. Smith"


@pytest.mark.asyncio
async def test_senior_cannot_retrieve_another_seniors_appointment(client, ids):
    response = await client.get(
        f"/api/v1/appointments/{ids['seed_appointment_id']}",
        headers=auth_header(ids["senior2"]),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_family_can_retrieve_authorized_senior_appointment(client, ids):
    token = await login(client, FAMILY_EMAIL)
    response = await client.get(
        f"/api/v1/appointments/{ids['seed_appointment_id']}",
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["senior_id"] == ids["john"]


@pytest.mark.asyncio
async def test_unauthorized_family_gets_403(client, ids):
    token = await login(client, FAMILY2_EMAIL)
    response = await client.get(
        f"/api/v1/appointments/{ids['seed_appointment_id']}",
        headers=auth_header(token),
    )
    assert response.status_code == 403
    create = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(token),
        json=create_body(ids, senior_id=ids["john"]),
    )
    assert create.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_retrieve_and_update_appointment(client, ids):
    token = await login(client, ADMIN_EMAIL)
    headers = auth_header(token)
    detail = await client.get(f"/api/v1/appointments/{ids['seed_appointment_id']}", headers=headers)
    assert detail.status_code == 200
    assert_appointment_shape(detail.json())
    updated = await client.patch(
        f"/api/v1/appointments/{ids['seed_appointment_id']}",
        headers=headers,
        json={"status": "CONFIRMED"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "CONFIRMED"
    restore = await client.patch(
        f"/api/v1/appointments/{ids['seed_appointment_id']}",
        headers=headers,
        json={"status": "REQUESTED"},
    )
    assert restore.status_code == 200
    assert restore.json()["status"] == "REQUESTED"


@pytest.mark.asyncio
async def test_senior_can_cancel_own_appointment(client, ids):
    created = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(ids["senior"]),
        json=create_body(ids, senior_id=ids["john"]),
    )
    appointment_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/appointments/{appointment_id}",
        headers=auth_header(ids["senior"]),
        json={"status": "CANCELLED"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"
    assert_appointment_shape(response.json())


@pytest.mark.asyncio
async def test_senior_can_reschedule_own_appointment(client, ids):
    created = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(ids["senior"]),
        json=create_body(ids, senior_id=ids["john"]),
    )
    appointment_id = created.json()["id"]
    response = await client.patch(
        f"/api/v1/appointments/{appointment_id}",
        headers=auth_header(ids["senior"]),
        json={"scheduled_at": RESCHEDULED_AT},
    )
    assert response.status_code == 200
    assert response.json()["id"] == appointment_id
    assert "2026-09-20" in response.json()["scheduled_at"]


@pytest.mark.asyncio
async def test_invalid_doctor_id_returns_404(client, ids):
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(ids["senior"]),
        json=create_body(ids, senior_id=ids["john"], doctor_id=str(uuid.uuid4())),
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_invalid_status_returns_validation_error(client, ids):
    response = await client.post(
        "/api/v1/appointments/",
        headers=auth_header(ids["senior"]),
        json=create_body(ids, senior_id=ids["john"], status="BOOKED"),
    )
    assert response.status_code == 422
    patch = await client.patch(
        f"/api/v1/appointments/{ids['seed_appointment_id']}",
        headers=auth_header(ids["senior"]),
        json={"status": "ACTIVE"},
    )
    assert patch.status_code == 422


@pytest.mark.asyncio
async def test_missing_token_returns_401(client, ids):
    assert (await client.get("/api/v1/appointments/")).status_code == 401
    assert (await client.get(f"/api/v1/appointments/{ids['seed_appointment_id']}")).status_code == 401
    assert (
        await client.post("/api/v1/appointments/", json=create_body(ids, senior_id=ids["john"]))
    ).status_code == 401
    assert (
        await client.patch(
            f"/api/v1/appointments/{ids['seed_appointment_id']}",
            json={"status": "CANCELLED"},
        )
    ).status_code == 401


@pytest.mark.asyncio
async def test_unknown_appointment_returns_404(client, ids):
    response = await client.get(
        f"/api/v1/appointments/{UNKNOWN_ID}",
        headers=auth_header(ids["senior"]),
    )
    assert response.status_code == 404
    patch = await client.patch(
        f"/api/v1/appointments/{UNKNOWN_ID}",
        headers=auth_header(ids["senior"]),
        json={"status": "CANCELLED"},
    )
    assert patch.status_code == 404


@pytest.mark.asyncio
async def test_care_manager_cannot_read_or_update_appointments(client, ids):
    token = await login(client, CARE_EMAIL)
    headers = auth_header(token)
    listed = await client.get("/api/v1/appointments/", headers=headers)
    assert listed.status_code == 403
    detail = await client.get(f"/api/v1/appointments/{ids['seed_appointment_id']}", headers=headers)
    assert detail.status_code == 403
    patched = await client.patch(
        f"/api/v1/appointments/{ids['seed_appointment_id']}",
        headers=headers,
        json={"status": "CONFIRMED"},
    )
    assert patched.status_code == 403


@pytest.mark.asyncio
async def test_openapi_exposes_appointment_write_schemas(client):
    spec = (await client.get("/openapi.json")).json()
    paths = spec["paths"]
    schemas = spec["components"]["schemas"]
    assert "get" in paths["/api/v1/appointments/"]
    assert "post" in paths["/api/v1/appointments/"]
    detail_path = "/api/v1/appointments/{appointment_id}"
    assert detail_path in paths
    assert "get" in paths[detail_path]
    assert "patch" in paths[detail_path]
    assert "AppointmentResponse" in schemas
    assert "AppointmentCreate" in schemas
    assert "AppointmentUpdate" in schemas
    assert "AppointmentStatus" in schemas
    create_props = set(schemas["AppointmentCreate"]["properties"].keys())
    assert create_props == {"senior_id", "doctor_id", "scheduled_at", "status"}
    update_props = set(schemas["AppointmentUpdate"]["properties"].keys())
    assert update_props == {"status", "scheduled_at", "doctor_id"}
    response_props = set(schemas["AppointmentResponse"]["properties"].keys())
    assert response_props == APPOINTMENT_KEYS
    assert set(schemas["AppointmentStatus"]["enum"]) == {
        "REQUESTED",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
    }
    assert paths["/api/v1/appointments/"]["post"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths[detail_path]["get"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths[detail_path]["patch"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert "delete" not in paths.get(detail_path, {})
    assert "notes" not in create_props
    assert "location" not in create_props
    assert "Availability" not in schemas
    assert "AppointmentSlot" not in schemas
