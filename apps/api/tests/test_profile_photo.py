from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.modules.seniors.schemas import MAX_PHOTO_CHARS

PASSWORD = "password123"
TINY_PHOTO = "data:image/jpeg;base64,abc123"
FAMILY_EMAIL = "family@example.com"


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


def unique_email(prefix: str) -> str:
    return f"{prefix}.{uuid.uuid4().hex[:10]}@example.com"


def unique_phone() -> str:
    return f"9{uuid.uuid4().int % 10**9:09d}"


async def register_senior(client: AsyncClient, email: str) -> None:
    response = await client.post(
        "/api/v1/auth/register/senior",
        json={
            "first_name": "Lakshmi",
            "last_name": "Sharma",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "date_of_birth": "1952-03-10",
            "address": "Borivali West",
            "emergency_contact": "9876543210",
        },
    )
    assert response.status_code == 200, response.text


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_senior_can_save_and_clear_profile_photo(client):
    email = unique_email("photo")
    await register_senior(client, email)
    token = await login(client, email)
    headers = auth_header(token)

    me = await client.get("/api/v1/seniors/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["photo"] is None

    saved = await client.patch("/api/v1/seniors/me", headers=headers, json={"photo": TINY_PHOTO})
    assert saved.status_code == 200, saved.text
    assert saved.json()["photo"] == TINY_PHOTO

    reloaded = await client.get("/api/v1/seniors/me", headers=headers)
    assert reloaded.status_code == 200
    assert reloaded.json()["photo"] == TINY_PHOTO

    cleared = await client.patch("/api/v1/seniors/me", headers=headers, json={"photo": None})
    assert cleared.status_code == 200, cleared.text
    assert cleared.json()["photo"] is None


@pytest.mark.asyncio
async def test_family_cannot_patch_senior_photo(client):
    token = await login(client, FAMILY_EMAIL)
    response = await client.patch(
        "/api/v1/seniors/me",
        headers=auth_header(token),
        json={"photo": TINY_PHOTO},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_invalid_profile_photo_is_rejected(client):
    email = unique_email("photo-bad")
    await register_senior(client, email)
    token = await login(client, email)

    response = await client.patch(
        "/api/v1/seniors/me",
        headers=auth_header(token),
        json={"photo": "https://example.com/avatar.jpg"},
    )
    assert response.status_code == 400
    assert "JPEG" in response.json()["detail"]


@pytest.mark.asyncio
async def test_oversized_profile_photo_is_rejected(client):
    email = unique_email("photo-big")
    await register_senior(client, email)
    token = await login(client, email)
    huge = "data:image/jpeg;base64," + ("A" * (MAX_PHOTO_CHARS + 1))

    response = await client.patch(
        "/api/v1/seniors/me",
        headers=auth_header(token),
        json={"photo": huge},
    )
    assert response.status_code == 400
    assert "too large" in response.json()["detail"]


@pytest.mark.asyncio
async def test_directory_list_omits_profile_photo(client):
    email = unique_email("photo-list")
    await register_senior(client, email)
    token = await login(client, email)
    await client.patch("/api/v1/seniors/me", headers=auth_header(token), json={"photo": TINY_PHOTO})

    admin = await login(client, "admin@example.com")
    listing = await client.get("/api/v1/seniors/", headers=auth_header(admin), params={"limit": 100})
    assert listing.status_code == 200
    items = listing.json()["items"]
    assert items
    assert all("photo" not in item for item in items)
    assert all("data:image" not in str(item) for item in items)
