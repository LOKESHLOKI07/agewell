"""Grocery and food delivery catalog contracts."""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"
TINY_IMAGE = "data:image/jpeg;base64,abc123"


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def unique_email(prefix: str) -> str:
    return f"{prefix}.{uuid.uuid4().hex[:10]}@example.com"


def unique_phone() -> str:
    return f"9{uuid.uuid4().int % 10**9:09d}"


async def register_senior(client: AsyncClient, email: str) -> None:
    response = await client.post(
        "/api/v1/auth/register/senior",
        json={
            "first_name": "Catalog",
            "last_name": "Tester",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "date_of_birth": "1952-03-10",
            "address": "Borivali West",
            "emergency_contact": "9876543210",
        },
    )
    assert response.status_code == 200, response.text


@pytest.mark.asyncio
async def test_admin_can_manage_grocery_product_with_image(client):
    admin = auth_header(await login(client, ADMIN_EMAIL))

    catalog = await client.get("/api/v1/catalog/grocery", headers=admin, params={"include_inactive": True})
    assert catalog.status_code == 200, catalog.text
    body = catalog.json()
    assert "categories" in body and "products" in body

    created_cat = await client.post(
        "/api/v1/catalog/grocery/categories",
        headers=admin,
        json={"name": f"Test Snacks {uuid.uuid4().hex[:6]}", "sort_order": 99},
    )
    assert created_cat.status_code == 200, created_cat.text
    category_id = created_cat.json()["id"]

    created = await client.post(
        "/api/v1/catalog/grocery/products",
        headers=admin,
        json={
            "category_id": category_id,
            "name": "Roasted Chana",
            "unit": "200 g",
            "price_label": "₹60",
            "image": TINY_IMAGE,
        },
    )
    assert created.status_code == 200, created.text
    product = created.json()
    assert product["image"] == TINY_IMAGE
    product_id = product["id"]

    email = unique_email("catalog-g")
    await register_senior(client, email)
    senior = auth_header(await login(client, email))
    member_view = await client.get("/api/v1/catalog/grocery", headers=senior)
    assert member_view.status_code == 200, member_view.text
    names = [p["name"] for p in member_view.json()["products"]]
    assert "Roasted Chana" in names

    deleted = await client.delete(f"/api/v1/catalog/grocery/products/{product_id}", headers=admin)
    assert deleted.status_code == 204, deleted.text
    await client.delete(f"/api/v1/catalog/grocery/categories/{category_id}", headers=admin)


@pytest.mark.asyncio
async def test_admin_can_manage_food_menu_item_with_image(client):
    admin = auth_header(await login(client, ADMIN_EMAIL))

    created_cuisine = await client.post(
        "/api/v1/catalog/food/cuisines",
        headers=admin,
        json={"name": f"Test Cuisine {uuid.uuid4().hex[:6]}", "description": "For automated tests"},
    )
    assert created_cuisine.status_code == 200, created_cuisine.text
    cuisine_id = created_cuisine.json()["id"]

    created = await client.post(
        "/api/v1/catalog/food/items",
        headers=admin,
        json={
            "cuisine_id": cuisine_id,
            "meal": "Lunch",
            "name": "Test Thali",
            "price_label": "₹199",
            "image": TINY_IMAGE,
        },
    )
    assert created.status_code == 200, created.text
    assert created.json()["image"] == TINY_IMAGE
    item_id = created.json()["id"]

    email = unique_email("catalog-f")
    await register_senior(client, email)
    senior = auth_header(await login(client, email))
    member_view = await client.get("/api/v1/catalog/food", headers=senior)
    assert member_view.status_code == 200, member_view.text
    names = [i["name"] for i in member_view.json()["items"]]
    assert "Test Thali" in names

    await client.delete(f"/api/v1/catalog/food/items/{item_id}", headers=admin)
    await client.delete(f"/api/v1/catalog/food/cuisines/{cuisine_id}", headers=admin)
