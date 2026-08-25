"""Phase 4.12B tracking sessions and location points."""

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
OPERATIONS_EMAIL = "operations@example.com"
PASSWORD = "password123"
UNKNOWN_ID = "00000000-0000-0000-0000-000000000099"
POINT_AT = "2026-08-21T12:00:00"
LATER_AT = "2026-08-21T12:05:00"

SESSION_KEYS = {"id", "user_id"}
POINT_KEYS = {"id", "session_id", "latitude", "longitude", "timestamp"}


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def point_body(lat="12.9716", lng="77.5946", timestamp=POINT_AT):
    return {"latitude": lat, "longitude": lng, "timestamp": timestamp}


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def tokens(client):
    return {
        "senior": await login(client, SENIOR_EMAIL),
        "senior2": await login(client, SENIOR2_EMAIL),
        "family": await login(client, FAMILY_EMAIL),
        "family2": await login(client, FAMILY2_EMAIL),
        "care": await login(client, CARE_EMAIL),
        "admin": await login(client, ADMIN_EMAIL),
        "ops": await login(client, OPERATIONS_EMAIL),
    }


@pytest_asyncio.fixture
async def ids(client, tokens):
    john = (await client.get("/api/v1/seniors/me", headers=auth_header(tokens["senior"]))).json()
    jane = (await client.get("/api/v1/seniors/me", headers=auth_header(tokens["senior2"]))).json()
    return {"john": john["id"], "jane": jane["id"], "john_user": john["user_id"], "jane_user": jane["user_id"]}


async def create_owned_session(client, token) -> dict:
    response = await client.post("/api/v1/tracking/", headers=auth_header(token), json={})
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.asyncio
async def test_unauthenticated_tracking_returns_401(client):
    assert (await client.get("/api/v1/tracking/")).status_code == 401
    assert (await client.post("/api/v1/tracking/", json={})).status_code == 401
    assert (await client.get(f"/api/v1/tracking/{UNKNOWN_ID}")).status_code == 401
    assert (await client.post(f"/api/v1/tracking/{UNKNOWN_ID}/points", json=point_body())).status_code == 401
    assert (await client.get(f"/api/v1/tracking/{UNKNOWN_ID}/latest")).status_code == 401
    assert (
        await client.get(f"/api/v1/tracking/{UNKNOWN_ID}/points", params={"limit": 20, "offset": 0})
    ).status_code == 401


@pytest.mark.asyncio
async def test_senior_creates_and_reads_own_session(client, tokens, ids):
    created = await create_owned_session(client, tokens["senior"])
    assert set(created.keys()) == SESSION_KEYS
    assert created["user_id"] == ids["john_user"]
    assert "latitude" not in created

    listed = await client.get("/api/v1/tracking/", headers=auth_header(tokens["senior"]))
    assert listed.status_code == 200
    assert any(item["id"] == created["id"] for item in listed.json()["items"])
    assert all(item["user_id"] == ids["john_user"] for item in listed.json()["items"])
    assert all(set(item.keys()) == SESSION_KEYS for item in listed.json()["items"])

    detail = await client.get(f"/api/v1/tracking/{created['id']}", headers=auth_header(tokens["senior"]))
    assert detail.status_code == 200
    assert detail.json()["id"] == created["id"]
    assert "longitude" not in detail.json()


@pytest.mark.asyncio
async def test_senior_cannot_access_another_senior_session(client, tokens):
    owned = await create_owned_session(client, tokens["senior"])
    other = auth_header(tokens["senior2"])
    assert (await client.get(f"/api/v1/tracking/{owned['id']}", headers=other)).status_code == 403
    assert (await client.get(f"/api/v1/tracking/{owned['id']}/latest", headers=other)).status_code == 403
    assert (
        await client.get(
            f"/api/v1/tracking/{owned['id']}/points",
            headers=other,
            params={"limit": 20, "offset": 0},
        )
    ).status_code == 403
    assert (
        await client.post(
            f"/api/v1/tracking/{owned['id']}/points",
            headers=other,
            json=point_body(),
        )
    ).status_code == 403
    listed = await client.get("/api/v1/tracking/", headers=other)
    assert listed.status_code == 200
    assert all(item["id"] != owned["id"] for item in listed.json()["items"])


@pytest.mark.asyncio
async def test_owner_creates_points_latest_and_bounded_history(client, tokens):
    headers = auth_header(tokens["senior"])
    session = await create_owned_session(client, tokens["senior"])
    first = await client.post(
        f"/api/v1/tracking/{session['id']}/points",
        headers=headers,
        json=point_body("12.97", "77.59", POINT_AT),
    )
    assert first.status_code == 200, first.text
    assert set(first.json().keys()) == POINT_KEYS
    assert first.json()["latitude"] == "12.97"
    assert first.json()["longitude"] == "77.59"
    assert "accuracy" not in first.json()
    assert "speed" not in first.json()

    second = await client.post(
        f"/api/v1/tracking/{session['id']}/points",
        headers=headers,
        json=point_body("13.00", "77.60", LATER_AT),
    )
    assert second.status_code == 200

    latest = await client.get(f"/api/v1/tracking/{session['id']}/latest", headers=headers)
    assert latest.status_code == 200
    assert latest.json()["id"] == second.json()["id"]
    assert latest.json()["latitude"] == "13.00"

    history = await client.get(
        f"/api/v1/tracking/{session['id']}/points",
        headers=headers,
        params={"limit": 1, "offset": 0},
    )
    assert history.status_code == 200
    assert history.json()["total"] == 2
    assert history.json()["limit"] == 1
    assert history.json()["offset"] == 0
    assert len(history.json()["items"]) == 1
    assert history.json()["items"][0]["id"] == second.json()["id"]

    missing_bounds = await client.get(f"/api/v1/tracking/{session['id']}/points", headers=headers)
    assert missing_bounds.status_code == 422


@pytest.mark.asyncio
async def test_invalid_coordinates_are_rejected(client, tokens):
    headers = auth_header(tokens["senior"])
    session = await create_owned_session(client, tokens["senior"])
    invalid = await client.post(
        f"/api/v1/tracking/{session['id']}/points",
        headers=headers,
        json=point_body("91", "0", POINT_AT),
    )
    assert invalid.status_code == 422


@pytest.mark.asyncio
async def test_family_authorized_senior_can_read_not_write(client, tokens, ids):
    session = await create_owned_session(client, tokens["senior"])
    await client.post(
        f"/api/v1/tracking/{session['id']}/points",
        headers=auth_header(tokens["senior"]),
        json=point_body(),
    )
    family = auth_header(tokens["family"])
    listed = await client.get(
        "/api/v1/tracking/",
        headers=family,
        params={"senior_id": ids["john"]},
    )
    assert listed.status_code == 200
    assert any(item["id"] == session["id"] for item in listed.json()["items"])
    assert all("latitude" not in item for item in listed.json()["items"])

    detail = await client.get(f"/api/v1/tracking/{session['id']}", headers=family)
    assert detail.status_code == 200
    latest = await client.get(f"/api/v1/tracking/{session['id']}/latest", headers=family)
    assert latest.status_code == 200
    assert latest.json()["latitude"] == "12.9716"

    write = await client.post(
        f"/api/v1/tracking/{session['id']}/points",
        headers=family,
        json=point_body("1", "1", POINT_AT),
    )
    assert write.status_code == 403


@pytest.mark.asyncio
async def test_family_unauthorized_senior_is_forbidden(client, tokens, ids):
    session = await create_owned_session(client, tokens["senior2"])
    await client.post(
        f"/api/v1/tracking/{session['id']}/points",
        headers=auth_header(tokens["senior2"]),
        json=point_body(),
    )
    family = auth_header(tokens["family"])
    listed = await client.get(
        "/api/v1/tracking/",
        headers=family,
        params={"senior_id": ids["jane"]},
    )
    assert listed.status_code == 403
    assert (await client.get(f"/api/v1/tracking/{session['id']}", headers=family)).status_code == 403
    assert (await client.get(f"/api/v1/tracking/{session['id']}/latest", headers=family)).status_code == 403
    outsider = await client.get(
        "/api/v1/tracking/",
        headers=auth_header(tokens["family2"]),
        params={"senior_id": ids["john"]},
    )
    assert outsider.status_code == 403


@pytest.mark.asyncio
async def test_family_list_requires_senior_id(client, tokens):
    missing = await client.get("/api/v1/tracking/", headers=auth_header(tokens["family"]))
    assert missing.status_code == 403


@pytest.mark.asyncio
async def test_care_manager_assigned_and_unassigned_senior(client, tokens, ids):
    john_session = await create_owned_session(client, tokens["senior"])
    jane_session = await create_owned_session(client, tokens["senior2"])
    await client.post(
        f"/api/v1/tracking/{john_session['id']}/points",
        headers=auth_header(tokens["senior"]),
        json=point_body(),
    )
    await client.post(
        f"/api/v1/tracking/{jane_session['id']}/points",
        headers=auth_header(tokens["senior2"]),
        json=point_body("11", "77", POINT_AT),
    )
    care = auth_header(tokens["care"])
    assigned = await client.get("/api/v1/tracking/", headers=care, params={"senior_id": ids["john"]})
    assert assigned.status_code == 200
    assert any(item["id"] == john_session["id"] for item in assigned.json()["items"])
    latest = await client.get(f"/api/v1/tracking/{john_session['id']}/latest", headers=care)
    assert latest.status_code == 200

    unassigned = await client.get("/api/v1/tracking/", headers=care, params={"senior_id": ids["jane"]})
    assert unassigned.status_code == 403
    assert (await client.get(f"/api/v1/tracking/{jane_session['id']}/latest", headers=care)).status_code == 403
    assert (
        await client.post(
            f"/api/v1/tracking/{john_session['id']}/points",
            headers=care,
            json=point_body("2", "2", POINT_AT),
        )
    ).status_code == 403


@pytest.mark.asyncio
async def test_admin_and_operations_staff_access_without_global_coordinates(client, tokens):
    session = await create_owned_session(client, tokens["senior"])
    await client.post(
        f"/api/v1/tracking/{session['id']}/points",
        headers=auth_header(tokens["senior"]),
        json=point_body(),
    )
    for role in ("admin", "ops"):
        headers = auth_header(tokens[role])
        listed = await client.get("/api/v1/tracking/", headers=headers)
        assert listed.status_code == 200, role
        assert listed.json()["total"] >= 1
        assert all(set(item.keys()) == SESSION_KEYS for item in listed.json()["items"])
        assert all("latitude" not in item and "longitude" not in item for item in listed.json()["items"])
        detail = await client.get(f"/api/v1/tracking/{session['id']}", headers=headers)
        assert detail.status_code == 200
        assert "latitude" not in detail.json()
        latest = await client.get(f"/api/v1/tracking/{session['id']}/latest", headers=headers)
        assert latest.status_code == 200
        assert latest.json()["latitude"] == "12.9716"


@pytest.mark.asyncio
async def test_unknown_session_returns_404(client, tokens):
    headers = auth_header(tokens["senior"])
    assert (await client.get(f"/api/v1/tracking/{UNKNOWN_ID}", headers=headers)).status_code == 404
    assert (await client.get(f"/api/v1/tracking/{UNKNOWN_ID}/latest", headers=headers)).status_code == 404
    assert (
        await client.get(
            f"/api/v1/tracking/{UNKNOWN_ID}/points",
            headers=headers,
            params={"limit": 20, "offset": 0},
        )
    ).status_code == 404
    assert (
        await client.post(
            f"/api/v1/tracking/{UNKNOWN_ID}/points",
            headers=headers,
            json=point_body(),
        )
    ).status_code == 404


@pytest.mark.asyncio
async def test_create_session_ignores_client_user_id(client, tokens, ids):
    response = await client.post(
        "/api/v1/tracking/",
        headers=auth_header(tokens["senior"]),
        json={"user_id": ids["jane_user"]},
    )
    assert response.status_code == 200
    assert response.json()["user_id"] == ids["john_user"]


@pytest.mark.asyncio
async def test_openapi_tracking_contracts(client):
    spec = (await client.get("/openapi.json")).json()
    paths = spec["paths"]
    schemas = spec["components"]["schemas"]
    assert "get" in paths["/api/v1/tracking/"]
    assert "post" in paths["/api/v1/tracking/"]
    assert "get" in paths["/api/v1/tracking/{session_id}"]
    assert "post" in paths["/api/v1/tracking/{session_id}/points"]
    assert "get" in paths["/api/v1/tracking/{session_id}/latest"]
    assert "get" in paths["/api/v1/tracking/{session_id}/points"]
    for name in (
        "TrackingSessionResponse",
        "TrackingSessionCreate",
        "TrackingPointResponse",
        "TrackingPointCreate",
        "ListPage_TrackingPointResponse_",
        "ListPage_TrackingSessionResponse_",
    ):
        assert name in schemas, name
    assert "TrackingResponse" not in schemas
    assert "TrackingCreate" not in schemas
    assert "TrackingSessionItem" not in schemas
    assert set(schemas["TrackingSessionResponse"]["properties"].keys()) == SESSION_KEYS
    assert set(schemas["TrackingPointResponse"]["properties"].keys()) == POINT_KEYS
    assert set(schemas["TrackingPointCreate"]["properties"].keys()) == {"latitude", "longitude", "timestamp"}
    assert "accuracy" not in schemas["TrackingPointResponse"]["properties"]
    assert "eta" not in schemas["TrackingPointResponse"]["properties"]
    assert paths["/api/v1/tracking/"]["get"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths["/api/v1/tracking/"]["post"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths["/api/v1/tracking/{session_id}/latest"]["get"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths["/api/v1/tracking/{session_id}/points"]["get"].get("security") == [{"OAuth2PasswordBearer": []}]
    history_params = {item["name"] for item in paths["/api/v1/tracking/{session_id}/points"]["get"]["parameters"]}
    assert "limit" in history_params
    assert "offset" in history_params
