import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

from app.modules.auth.google_oauth import google_profile_from_id_token


@pytest.mark.asyncio
async def test_google_profile_from_id_token(monkeypatch):
    monkeypatch.setattr(
        "app.modules.auth.google_oauth.settings.GOOGLE_CLIENT_ID",
        "android-client.apps.googleusercontent.com",
    )

    info = MagicMock()
    info.status_code = 200
    info.json.return_value = {
        "aud": "android-client.apps.googleusercontent.com",
        "email": "Lakshmi.Sharma@gmail.com",
        "email_verified": "true",
        "name": "Lakshmi Sharma",
    }

    mock_client = AsyncMock()
    mock_client.get.return_value = info
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = False

    with patch("app.modules.auth.google_oauth.httpx.AsyncClient", return_value=mock_client):
        profile = await google_profile_from_id_token("header.payload.sig")

    assert profile == {"email": "lakshmi.sharma@gmail.com", "full_name": "Lakshmi Sharma"}


@pytest.mark.asyncio
async def test_google_id_token_wrong_audience(monkeypatch):
    monkeypatch.setattr(
        "app.modules.auth.google_oauth.settings.GOOGLE_CLIENT_ID",
        "android-client.apps.googleusercontent.com",
    )
    info = MagicMock()
    info.status_code = 200
    info.json.return_value = {
        "aud": "some-other-client",
        "email": "a@gmail.com",
        "email_verified": True,
    }
    mock_client = AsyncMock()
    mock_client.get.return_value = info
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = False

    with patch("app.modules.auth.google_oauth.httpx.AsyncClient", return_value=mock_client):
        with pytest.raises(HTTPException) as caught:
            await google_profile_from_id_token("header.payload.sig")
    assert caught.value.status_code == 401
