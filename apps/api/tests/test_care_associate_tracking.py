"""Phase 4.13A care associate live tracking via assigned visits."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

from app.db.session import AsyncSessionLocal
from app.main import app
from app.modules.tracking.models import LocationPoint, LocationSession
from app.modules.users.models import User

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
UNAVAILABLE = "Care associate tracking is unavailable"
NOT_ASSIGNED = "Care manager is not assigned to this visit"

SESSION_KEYS = {"id", "user_id"}
POINT_KEYS = {"id", "session_id", "latitude", "longitude", "timestamp"}
CARE_ASSOCIATE_PATH = "/api/v1/tracking/care-associate/"


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
    visits = (await client.get("/api/v1/visits/", headers=auth_header(tokens["senior"]))).json()
    john_visit = next(item for item in visits["items"] if item.get("care_manager_id"))
    care_me = (await client.get("/api/v1/users/me", headers=auth_header(tokens["care"]))).json()
    return {
        "john": john["id"],
        "jane": jane["id"],
        "john_user": john["user_id"],
        "jane_user": jane["user_id"],
        "john_visit": john_visit["id"],
        "care_user": care_me["id"],
        "care_manager": john_visit["care_manager_id"],
    }


async def ensure_care_session(client, care_token: str) -> dict:
    response = await client.post(CARE_ASSOCIATE_PATH, headers=auth_header(care_token), json={})
    assert response.status_code == 200, response.text
    return response.json()


async def clear_care_tracking_sessions() -> None:
    async with AsyncSessionLocal() as session:
        care_id = (
            await session.execute(select(User.id).where(User.email == CARE_EMAIL))
        ).scalar_one()
        session_ids = [
            row[0]
            for row in (
                await session.execute(select(LocationSession.id).where(LocationSession.user_id == care_id))
            ).all()
        ]
        if session_ids:
            await session.execute(delete(LocationPoint).where(LocationPoint.session_id.in_(session_ids)))
        await session.execute(delete(LocationSession).where(LocationSession.user_id == care_id))
        await session.commit()


@pytest.mark.asyncio
async def test_unauthenticated_care_associate_tracking_returns_401(client, ids):
    visit = ids["john_visit"]
    assert (await client.post(CARE_ASSOCIATE_PATH, json={})).status_code == 401
    assert (await client.post(f"{CARE_ASSOCIATE_PATH}{UNKNOWN_ID}/points", json=point_body())).status_code == 401
    assert (await client.get(f"/api/v1/tracking/visits/{visit}/care-associate")).status_code == 401
    assert (await client.get(f"/api/v1/tracking/visits/{visit}/care-associate/latest")).status_code == 401
    assert (
        await client.get(
            f"/api/v1/tracking/visits/{visit}/care-associate/points",
            params={"limit": 20, "offset": 0},
        )
    ).status_code == 401


@pytest.mark.asyncio
async def test_non_care_roles_cannot_create_care_associate_session(client, tokens):
    for role in ("senior", "family", "admin", "ops"):
        response = await client.post(CARE_ASSOCIATE_PATH, headers=auth_header(tokens[role]), json={})
        assert response.status_code == 403, role


@pytest.mark.asyncio
async def test_care_manager_creates_own_session_without_client_ids(client, tokens, ids):
    created = await client.post(
        CARE_ASSOCIATE_PATH,
        headers=auth_header(tokens["care"]),
        json={"user_id": ids["john_user"], "care_manager_id": ids["care_manager"], "senior_id": ids["john"]},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert set(body.keys()) == SESSION_KEYS
    assert body["user_id"] == ids["care_user"]
    assert body["user_id"] != ids["john_user"]
    reused = await client.post(CARE_ASSOCIATE_PATH, headers=auth_header(tokens["care"]), json={})
    assert reused.status_code == 200
    assert reused.json()["id"] == body["id"]


@pytest.mark.asyncio
async def test_care_manager_writes_own_points_and_rejects_invalid_coordinates(client, tokens):
    session = await ensure_care_session(client, tokens["care"])
    headers = auth_header(tokens["care"])
    first = await client.post(
        f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
        headers=headers,
        json=point_body("12.97", "77.59", POINT_AT),
    )
    assert first.status_code == 200, first.text
    assert set(first.json().keys()) == POINT_KEYS
    assert "eta" not in first.json()
    assert "speed" not in first.json()

    second = await client.post(
        f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
        headers=headers,
        json=point_body("13.08", "77.64", LATER_AT),
    )
    assert second.status_code == 200

    invalid_lat = await client.post(
        f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
        headers=headers,
        json=point_body("91", "0", POINT_AT),
    )
    assert invalid_lat.status_code == 422
    invalid_lng = await client.post(
        f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
        headers=headers,
        json=point_body("0", "181", POINT_AT),
    )
    assert invalid_lng.status_code == 422
    invalid_ts = await client.post(
        f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
        headers=headers,
        json=point_body("12", "77", "not-a-timestamp"),
    )
    assert invalid_ts.status_code == 422


@pytest.mark.asyncio
async def test_care_manager_cannot_write_another_managers_session(client, tokens):
    owned = await client.post("/api/v1/tracking/", headers=auth_header(tokens["senior"]), json={})
    assert owned.status_code == 200
    denied = await client.post(
        f"{CARE_ASSOCIATE_PATH}{owned.json()['id']}/points",
        headers=auth_header(tokens["care"]),
        json=point_body(),
    )
    assert denied.status_code == 403


@pytest.mark.asyncio
async def test_assigned_senior_and_family_read_associate_latest(client, tokens, ids):
    session = await ensure_care_session(client, tokens["care"])
    await client.post(
        f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
        headers=auth_header(tokens["care"]),
        json=point_body("13.08", "77.64", LATER_AT),
    )
    visit = ids["john_visit"]
    senior = await client.get(
        f"/api/v1/tracking/visits/{visit}/care-associate/latest",
        headers=auth_header(tokens["senior"]),
    )
    assert senior.status_code == 200, senior.text
    assert senior.json()["latitude"] == "13.08"
    assert senior.json()["session_id"] == session["id"]
    assert set(senior.json().keys()) == POINT_KEYS

    family = await client.get(
        f"/api/v1/tracking/visits/{visit}/care-associate/latest",
        headers=auth_header(tokens["family"]),
    )
    assert family.status_code == 200
    assert family.json()["longitude"] == "77.64"

    listed = await client.get(
        f"/api/v1/tracking/visits/{visit}/care-associate/points",
        headers=auth_header(tokens["senior"]),
        params={"limit": 1, "offset": 0},
    )
    assert listed.status_code == 200
    assert listed.json()["limit"] == 1
    assert listed.json()["items"][0]["id"] == senior.json()["id"]


@pytest.mark.asyncio
async def test_unrelated_senior_and_unauthorized_family_are_forbidden(client, tokens, ids):
    visit = ids["john_visit"]
    other_senior = await client.get(
        f"/api/v1/tracking/visits/{visit}/care-associate/latest",
        headers=auth_header(tokens["senior2"]),
    )
    assert other_senior.status_code == 403
    outsider = await client.get(
        f"/api/v1/tracking/visits/{visit}/care-associate",
        headers=auth_header(tokens["family2"]),
    )
    assert outsider.status_code == 403


@pytest.mark.asyncio
async def test_assigned_and_unassigned_care_manager(client, tokens, ids):
    session = await ensure_care_session(client, tokens["care"])
    await client.post(
        f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
        headers=auth_header(tokens["care"]),
        json=point_body(),
    )
    assigned = await client.get(
        f"/api/v1/tracking/visits/{ids['john_visit']}/care-associate/latest",
        headers=auth_header(tokens["care"]),
    )
    assert assigned.status_code == 200

    jane_visit = await client.post(
        "/api/v1/visits/",
        headers=auth_header(tokens["admin"]),
        json={"senior_id": ids["jane"], "notes": "Unassigned associate check"},
    )
    assert jane_visit.status_code == 200, jane_visit.text
    unassigned = await client.get(
        f"/api/v1/tracking/visits/{jane_visit.json()['id']}/care-associate/latest",
        headers=auth_header(tokens["care"]),
    )
    assert unassigned.status_code == 403


@pytest.mark.asyncio
async def test_unknown_visit_and_visit_without_care_manager(client, tokens, ids):
    missing = await client.get(
        f"/api/v1/tracking/visits/{UNKNOWN_ID}/care-associate/latest",
        headers=auth_header(tokens["senior"]),
    )
    assert missing.status_code == 404

    created = await client.post(
        "/api/v1/visits/",
        headers=auth_header(tokens["admin"]),
        json={"senior_id": ids["john"], "notes": "No associate"},
    )
    assert created.status_code == 200
    unassigned = await client.get(
        f"/api/v1/tracking/visits/{created.json()['id']}/care-associate/latest",
        headers=auth_header(tokens["senior"]),
    )
    assert unassigned.status_code == 404
    assert unassigned.json()["detail"] == NOT_ASSIGNED


@pytest.mark.asyncio
async def test_no_session_and_no_points_and_no_senior_fallback(client, tokens, ids):
    await clear_care_tracking_sessions()
    visit = ids["john_visit"]
    senior = auth_header(tokens["senior"])
    unavailable = await client.get(f"/api/v1/tracking/visits/{visit}/care-associate", headers=senior)
    assert unavailable.status_code == 404
    assert unavailable.json()["detail"] == UNAVAILABLE

    senior_session = await client.post("/api/v1/tracking/", headers=senior, json={})
    assert senior_session.status_code == 200
    await client.post(
        f"/api/v1/tracking/{senior_session.json()['id']}/points",
        headers=senior,
        json=point_body("1.11", "2.22", POINT_AT),
    )
    still_unavailable = await client.get(
        f"/api/v1/tracking/visits/{visit}/care-associate/latest",
        headers=senior,
    )
    assert still_unavailable.status_code == 404
    assert still_unavailable.json()["detail"] == UNAVAILABLE

    session = await ensure_care_session(client, tokens["care"])
    no_points = await client.get(f"/api/v1/tracking/visits/{visit}/care-associate/latest", headers=senior)
    assert no_points.status_code == 404
    assert no_points.json()["detail"] == "Location point not found"
    assert session["user_id"] == ids["care_user"]
    assert session["user_id"] != ids["john_user"]


@pytest.mark.asyncio
async def test_staff_can_read_but_cannot_write_care_associate_points(client, tokens, ids):
    session = await ensure_care_session(client, tokens["care"])
    await client.post(
        f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
        headers=auth_header(tokens["care"]),
        json=point_body(),
    )
    visit = ids["john_visit"]
    for role in ("admin", "ops"):
        latest = await client.get(
            f"/api/v1/tracking/visits/{visit}/care-associate/latest",
            headers=auth_header(tokens[role]),
        )
        assert latest.status_code == 200, role
        write = await client.post(
            f"{CARE_ASSOCIATE_PATH}{session['id']}/points",
            headers=auth_header(tokens[role]),
            json=point_body("3", "4", POINT_AT),
        )
        assert write.status_code == 403, role


@pytest.mark.asyncio
async def test_openapi_care_associate_contracts(client):
    spec = (await client.get("/openapi.json")).json()
    paths = spec["paths"]
    schemas = spec["components"]["schemas"]
    assert "post" in paths["/api/v1/tracking/care-associate/"]
    assert "post" in paths["/api/v1/tracking/care-associate/{session_id}/points"]
    assert "get" in paths["/api/v1/tracking/visits/{visit_id}/care-associate"]
    assert "get" in paths["/api/v1/tracking/visits/{visit_id}/care-associate/latest"]
    assert "get" in paths["/api/v1/tracking/visits/{visit_id}/care-associate/points"]
    assert "get" in paths["/api/v1/tracking/"]
    assert "post" in paths["/api/v1/tracking/"]
    for name in (
        "CareAssociateTrackingSessionResponse",
        "CareAssociateTrackingSessionCreate",
        "CareAssociateTrackingPointResponse",
        "CareAssociateTrackingPointCreate",
        "CareAssociateLatestLocationResponse",
    ):
        assert name in schemas, name
    latest_props = set(schemas["CareAssociateLatestLocationResponse"]["properties"].keys())
    assert latest_props == POINT_KEYS
    assert "eta" not in latest_props
    assert "distance" not in latest_props
    assert paths["/api/v1/tracking/care-associate/"]["post"].get("security") == [{"OAuth2PasswordBearer": []}]
    assert paths["/api/v1/tracking/visits/{visit_id}/care-associate/latest"]["get"].get("security") == [
        {"OAuth2PasswordBearer": []}
    ]
    history = {item["name"] for item in paths["/api/v1/tracking/visits/{visit_id}/care-associate/points"]["get"]["parameters"]}
    assert "limit" in history
    assert "offset" in history
