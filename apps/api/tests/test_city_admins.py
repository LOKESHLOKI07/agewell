import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"


async def login(client: AsyncClient, email: str, password: str = PASSWORD) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def create_city_admin(client: AsyncClient, super_headers: dict, city: str):
    suffix = uuid.uuid4().hex[:8]
    created = await client.post(
        "/api/v1/users/",
        headers=super_headers,
        json={
            "email": f"{city}-admin-{suffix}@example.com",
            "phone": f"71{suffix[:8]}",
            "role": "ADMIN",
            "password": PASSWORD,
            "service_city": city,
        },
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["service_city"] == city
    assert body["role"] == "ADMIN"
    return body


async def create_city_senior(client: AsyncClient, super_headers: dict, *, city: str, address: str):
    suffix = uuid.uuid4().hex[:8]
    user = await client.post(
        "/api/v1/users/",
        headers=super_headers,
        json={
            "email": f"{city}-senior-{suffix}@example.com",
            "phone": f"72{suffix[:8]}",
            "role": "SENIOR",
            "password": PASSWORD,
        },
    )
    assert user.status_code == 200, user.text
    senior = await client.post(
        "/api/v1/seniors/",
        headers=super_headers,
        json={
            "user_id": user.json()["id"],
            "first_name": city.title(),
            "last_name": suffix[:4],
            "date_of_birth": "1940-01-01",
            "address": address,
            "emergency_contact": "911",
        },
    )
    assert senior.status_code == 200, senior.text
    assert senior.json()["service_city"] == city
    return senior.json()


@pytest.mark.asyncio
async def test_super_admin_creates_city_admins_and_scopes_data(client):
    super_token = await login(client, ADMIN_EMAIL)
    super_headers = auth_header(super_token)

    missing_city = await client.post(
        "/api/v1/users/",
        headers=super_headers,
        json={
            "email": f"nocity-{uuid.uuid4().hex[:8]}@example.com",
            "phone": f"70{uuid.uuid4().hex[:8]}",
            "role": "ADMIN",
            "password": PASSWORD,
        },
    )
    assert missing_city.status_code == 400

    mumbai_admin = await create_city_admin(client, super_headers, "mumbai")
    chandrapur_admin = await create_city_admin(client, super_headers, "chandrapur")
    mumbai_senior = await create_city_senior(
        client, super_headers, city="mumbai", address="Kandivali West"
    )
    chandrapur_senior = await create_city_senior(
        client, super_headers, city="chandrapur", address="Wani, Chandrapur"
    )

    mumbai_headers = auth_header(await login(client, mumbai_admin["email"]))
    chandrapur_headers = auth_header(await login(client, chandrapur_admin["email"]))

    me = await client.get("/api/v1/users/me", headers=mumbai_headers)
    assert me.status_code == 200
    assert me.json()["service_city"] == "mumbai"

    mumbai_list = await client.get("/api/v1/seniors/", headers=mumbai_headers, params={"limit": 100})
    assert mumbai_list.status_code == 200
    mumbai_ids = {item["id"] for item in mumbai_list.json()["items"]}
    assert mumbai_senior["id"] in mumbai_ids
    assert chandrapur_senior["id"] not in mumbai_ids

    hidden = await client.get(f"/api/v1/seniors/{chandrapur_senior['id']}", headers=mumbai_headers)
    assert hidden.status_code == 404

    visible = await client.get(f"/api/v1/seniors/{mumbai_senior['id']}", headers=mumbai_headers)
    assert visible.status_code == 200

    chandrapur_list = await client.get(
        "/api/v1/seniors/", headers=chandrapur_headers, params={"limit": 100}
    )
    chandrapur_ids = {item["id"] for item in chandrapur_list.json()["items"]}
    assert chandrapur_senior["id"] in chandrapur_ids
    assert mumbai_senior["id"] not in chandrapur_ids

    forbidden = await client.post(
        "/api/v1/users/",
        headers=mumbai_headers,
        json={
            "email": f"nested-{uuid.uuid4().hex[:8]}@example.com",
            "phone": f"73{uuid.uuid4().hex[:8]}",
            "role": "ADMIN",
            "password": PASSWORD,
            "service_city": "mumbai",
        },
    )
    assert forbidden.status_code == 403

    changed = await client.post(
        "/api/v1/auth/change-password",
        headers=mumbai_headers,
        json={"current_password": PASSWORD, "new_password": "password456"},
    )
    assert changed.status_code == 200, changed.text
    assert (await login(client, mumbai_admin["email"], "password456"))


@pytest.mark.asyncio
async def test_city_admin_users_list_hides_other_city_and_super(client):
    super_token = await login(client, ADMIN_EMAIL)
    super_headers = auth_header(super_token)
    mumbai_admin = await create_city_admin(client, super_headers, "mumbai")
    other = await create_city_admin(client, super_headers, "chandrapur")
    mumbai_headers = auth_header(await login(client, mumbai_admin["email"]))

    listing = await client.get("/api/v1/users/", headers=mumbai_headers, params={"limit": 100})
    assert listing.status_code == 200
    emails = {item["email"] for item in listing.json()["items"]}
    assert mumbai_admin["email"] in emails
    assert other["email"] not in emails
    assert ADMIN_EMAIL not in emails


@pytest.mark.asyncio
async def test_super_admin_can_filter_seniors_by_city(client):
    super_token = await login(client, ADMIN_EMAIL)
    super_headers = auth_header(super_token)
    mumbai_senior = await create_city_senior(
        client, super_headers, city="mumbai", address="Borivali West"
    )
    chandrapur_senior = await create_city_senior(
        client, super_headers, city="chandrapur", address="Warora"
    )

    mumbai_list = await client.get(
        "/api/v1/seniors/",
        headers=super_headers,
        params={"limit": 100, "service_city": "mumbai"},
    )
    assert mumbai_list.status_code == 200
    mumbai_ids = {item["id"] for item in mumbai_list.json()["items"]}
    assert mumbai_senior["id"] in mumbai_ids
    assert chandrapur_senior["id"] not in mumbai_ids

    chandrapur_list = await client.get(
        "/api/v1/seniors/",
        headers=super_headers,
        params={"limit": 100, "service_city": "chandrapur"},
    )
    assert chandrapur_list.status_code == 200
    chandrapur_ids = {item["id"] for item in chandrapur_list.json()["items"]}
    assert chandrapur_senior["id"] in chandrapur_ids
    assert mumbai_senior["id"] not in chandrapur_ids

    # City staff cannot widen scope via the query param.
    mumbai_admin = await create_city_admin(client, super_headers, "mumbai")
    mumbai_headers = auth_header(await login(client, mumbai_admin["email"]))
    forced = await client.get(
        "/api/v1/seniors/",
        headers=mumbai_headers,
        params={"limit": 100, "service_city": "chandrapur"},
    )
    assert forced.status_code == 200
    forced_ids = {item["id"] for item in forced.json()["items"]}
    assert mumbai_senior["id"] in forced_ids
    assert chandrapur_senior["id"] not in forced_ids

    bad = await client.get(
        "/api/v1/seniors/",
        headers=super_headers,
        params={"limit": 100, "service_city": "pune"},
    )
    assert bad.status_code == 400
