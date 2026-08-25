import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

SENIOR_EMAIL = "senior@example.com"
SENIOR2_EMAIL = "senior2@example.com"
PASSWORD = "password123"

HEALTH_PATHS = [
    "/api/v1/healthcare/medications",
    "/api/v1/healthcare/medication-schedules",
    "/api/v1/healthcare/medical-records",
    "/api/v1/healthcare/lab-results",
    "/api/v1/healthcare/documents",
    "/api/v1/healthcare/providers",
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


def assert_list_page(payload: dict):
    assert set(payload.keys()) >= {"items", "total", "limit", "offset"}
    assert isinstance(payload["items"], list)
    assert payload["total"] == len(payload["items"]) or payload["total"] >= len(payload["items"])


@pytest.mark.asyncio
async def test_own_medical_records(client):
    token = await login(client, SENIOR_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(token))).json()
    response = await client.get("/api/v1/healthcare/medical-records", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert_list_page(payload)
    assert payload["total"] >= 1
    assert all(item["senior_id"] == me["id"] for item in payload["items"])
    assert any(item["provider_name"] == "Dr. Smith" for item in payload["items"])
    assert any(item["notes"] for item in payload["items"])
    assert "hashed_password" not in payload["items"][0]


@pytest.mark.asyncio
async def test_cross_senior_medical_records_forbidden(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    response = await client.get(
        "/api/v1/healthcare/medical-records",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_own_lab_results(client):
    token = await login(client, SENIOR_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(token))).json()
    response = await client.get("/api/v1/healthcare/lab-results", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert_list_page(payload)
    assert payload["total"] >= 2
    names = {item["test_name"] for item in payload["items"]}
    assert "HbA1c" in names
    assert all(item["senior_id"] == me["id"] for item in payload["items"])
    assert "normal_range" not in payload["items"][0]
    assert "units" not in payload["items"][0]


@pytest.mark.asyncio
async def test_lab_results_filter_by_test_name(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get(
        "/api/v1/healthcare/lab-results",
        headers=auth_header(token),
        params={"test_name": "HbA1c"},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert items
    assert all(item["test_name"] == "HbA1c" for item in items)


@pytest.mark.asyncio
async def test_cross_senior_lab_results_forbidden(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    response = await client.get(
        "/api/v1/healthcare/lab-results",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_own_health_documents(client):
    token = await login(client, SENIOR_EMAIL)
    me = (await client.get("/api/v1/seniors/me", headers=auth_header(token))).json()
    response = await client.get("/api/v1/healthcare/documents", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert_list_page(payload)
    assert payload["total"] >= 1
    item = payload["items"][0]
    assert item["senior_id"] == me["id"]
    assert item["file_url"].startswith("https://example.com/dev/agewell/")
    assert item["document_type"]
    assert "storage_key" not in item


@pytest.mark.asyncio
async def test_cross_senior_health_documents_forbidden(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    response = await client.get(
        "/api/v1/healthcare/documents",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_own_healthcare_providers_derived_and_deduped(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)
    providers = await client.get("/api/v1/healthcare/providers", headers=headers)
    records = await client.get("/api/v1/healthcare/medical-records", headers=headers)
    appointments = await client.get("/api/v1/appointments/", headers=headers)
    assert providers.status_code == 200
    payload = providers.json()
    assert_list_page(payload)
    names = [item["name"] for item in payload["items"]]
    assert len(names) == len(set(names))
    assert "Dr. Smith" in names
    assert "Dr. Patel" in names
    related_ids = {item["provider_id"] for item in records.json()["items"]}
    related_ids.update(item["doctor_id"] for item in appointments.json()["items"] if item.get("doctor_id"))
    assert {item["id"] for item in payload["items"]} <= related_ids
    assert all("specialty" in item for item in payload["items"])


@pytest.mark.asyncio
async def test_own_medication_schedules(client):
    token = await login(client, SENIOR_EMAIL)
    response = await client.get("/api/v1/healthcare/medication-schedules", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()
    assert_list_page(payload)
    assert payload["total"] >= 1
    item = payload["items"][0]
    assert item["medication_name"] == "Aspirin"
    assert item["dosage"] == "100mg"
    assert item["schedule_time"]
    assert item["frequency"]
    assert item["medication_id"]


@pytest.mark.asyncio
async def test_cross_senior_medication_schedules_forbidden(client):
    token = await login(client, SENIOR_EMAIL)
    other_token = await login(client, SENIOR2_EMAIL)
    other = (await client.get("/api/v1/seniors/me", headers=auth_header(other_token))).json()
    response = await client.get(
        "/api/v1/healthcare/medication-schedules",
        headers=auth_header(token),
        params={"senior_id": other["id"]},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_health_endpoints_require_auth(client):
    for path in HEALTH_PATHS:
        response = await client.get(path)
        assert response.status_code == 401, path


@pytest.mark.asyncio
async def test_senior_b_health_lists_are_empty_not_stubs(client):
    token = await login(client, SENIOR2_EMAIL)
    headers = auth_header(token)
    for path in [
        "/api/v1/healthcare/medical-records",
        "/api/v1/healthcare/lab-results",
        "/api/v1/healthcare/documents",
        "/api/v1/healthcare/providers",
        "/api/v1/healthcare/medications",
        "/api/v1/healthcare/medication-schedules",
    ]:
        response = await client.get(path, headers=headers)
        assert response.status_code == 200, path
        payload = response.json()
        assert_list_page(payload)
        assert payload["items"] == []
        assert payload["total"] == 0


@pytest.mark.asyncio
async def test_existing_medications_and_appointments_still_work(client):
    token = await login(client, SENIOR_EMAIL)
    headers = auth_header(token)
    medications = await client.get("/api/v1/healthcare/medications", headers=headers)
    appointments = await client.get("/api/v1/appointments/", headers=headers)
    assert medications.status_code == 200
    assert medications.json()["items"][0]["name"] == "Aspirin"
    assert appointments.status_code == 200
    assert appointments.json()["items"][0]["doctor_name"] == "Dr. Smith"


@pytest.mark.asyncio
async def test_openapi_health_schemas_are_complete(client):
    spec = (await client.get("/openapi.json")).json()
    expected = {
        "/api/v1/healthcare/medications": "ListPage_MedicationResponse_",
        "/api/v1/healthcare/medication-schedules": "ListPage_MedicationScheduleResponse_",
        "/api/v1/healthcare/medical-records": "ListPage_MedicalRecordResponse_",
        "/api/v1/healthcare/lab-results": "ListPage_LabResultResponse_",
        "/api/v1/healthcare/documents": "ListPage_HealthDocumentResponse_",
        "/api/v1/healthcare/providers": "ListPage_HealthcareProviderResponse_",
    }
    for path, schema_name in expected.items():
        schema = spec["paths"][path]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
        ref = schema.get("$ref", "")
        assert schema_name in ref, (path, ref)
        component = spec["components"]["schemas"][schema_name]
        assert component.get("properties", {}).get("items")
        item_ref = component["properties"]["items"]["items"]["$ref"].split("/")[-1]
        item_schema = spec["components"]["schemas"][item_ref]
        props = set(item_schema.get("properties", {}).keys())
        assert props != {"id"}
        assert "UUID" not in item_schema.get("title", "")
