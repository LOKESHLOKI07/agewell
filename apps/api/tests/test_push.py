"""Expo push token registration and emergency push payload."""

from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.notifications.push import ExpoPushSender, is_expo_push_token
from app.modules.notifications.emergency_copy import companion_emergency_copy, family_emergency_copy


def test_is_expo_push_token():
    assert is_expo_push_token("ExponentPushToken[abc123]")
    assert not is_expo_push_token("fcm-native-token")
    assert not is_expo_push_token("")


def test_sos_push_copy():
    title, body = family_emergency_copy("John", "Medical Emergency")
    assert title == "AgeWell Emergency"
    assert "John has triggered an SOS" in body
    assert "Tap to respond" in body
    c_title, c_body = companion_emergency_copy("John")
    assert c_title == "AgeWell Emergency"
    assert "John has triggered an SOS" in c_body


@pytest.mark.asyncio
async def test_expo_push_sender_posts_high_priority_emergency():
    token_repo = MagicMock()
    token_row = MagicMock()
    token_row.token = "ExponentPushToken[device1]"
    token_repo.list_tokens_for_users = AsyncMock(return_value=[token_row])
    token_repo.delete_by_token = AsyncMock(return_value=1)

    sender = ExpoPushSender(token_repo)
    emergency_id = uuid4()
    user_id = uuid4()

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"data": [{"status": "ok", "id": "ticket-1"}]}

    mock_client = MagicMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)

    with patch("app.modules.notifications.push.httpx.AsyncClient", return_value=mock_client):
        with patch("app.modules.notifications.push.settings") as settings:
            settings.EXPO_PUSH_ENABLED = True
            settings.EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
            count = await sender.send_emergency(
                user_ids=[user_id],
                title="AgeWell Emergency",
                body="John has triggered an SOS. Tap to respond.",
                emergency_id=emergency_id,
            )

    assert count == 1
    mock_client.post.assert_awaited_once()
    payload = mock_client.post.await_args.kwargs.get("json") or mock_client.post.await_args.args[1]
    assert isinstance(payload, list)
    message = payload[0]
    assert message["to"] == "ExponentPushToken[device1]"
    assert message["priority"] == "high"
    assert message["sound"] == "default"
    assert message["channelId"] == "emergency"
    assert message["data"]["type"] == "emergency"
    assert message["data"]["emergencyId"] == str(emergency_id)


@pytest.mark.asyncio
async def test_expo_push_disabled_skips_send():
    token_repo = MagicMock()
    token_repo.list_tokens_for_users = AsyncMock(return_value=[MagicMock(token="ExponentPushToken[x]")])
    sender = ExpoPushSender(token_repo)
    with patch("app.modules.notifications.push.settings") as settings:
        settings.EXPO_PUSH_ENABLED = False
        count = await sender.send_emergency(
            user_ids=[uuid4()],
            title="t",
            body="b",
            emergency_id=uuid4(),
        )
    assert count == 0
