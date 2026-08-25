import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import uuid

from app.main import app
from app.api.deps import get_db

TEST_DB_URL = "postgresql+asyncpg://postgres:admin%4077@127.0.0.1:5432/agewell"
test_engine = create_async_engine(TEST_DB_URL)

@pytest.mark.asyncio
async def test_auth_valid_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", data={"username": "senior@example.com", "password": "password123"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

@pytest.mark.asyncio
async def test_auth_invalid_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", data={"username": "senior@example.com", "password": "wrong"})
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_auth_unknown_user():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", data={"username": "nobody@example.com", "password": "password123"})
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_users_me():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", data={"username": "senior@example.com", "password": "password123"})
        token = response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        me_resp = await ac.get("/api/v1/users/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == "senior@example.com"
        assert "hashed_password" not in me_resp.json()

@pytest.mark.asyncio
async def test_get_users_me_without_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        me_resp = await ac.get("/api/v1/users/me")
        assert me_resp.status_code == 401

@pytest.mark.asyncio
async def test_get_users_me_invalid_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"Authorization": "Bearer notatoken"}
        me_resp = await ac.get("/api/v1/users/me", headers=headers)
        assert me_resp.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", data={"username": "senior@example.com", "password": "password123"})
        refresh = response.json()["refresh_token"]
        
        refresh_resp = await ac.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
        assert refresh_resp.status_code == 200
        assert "access_token" in refresh_resp.json()

@pytest.mark.asyncio
async def test_invalid_refresh_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        refresh_resp = await ac.post("/api/v1/auth/refresh", json={"refresh_token": "bad"})
        assert refresh_resp.status_code == 401

