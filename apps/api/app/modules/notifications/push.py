"""Send emergency (and other) pushes via Expo Push Service → FCM/APNs."""

from __future__ import annotations

import logging
from typing import Any, Optional, Sequence
from uuid import UUID

import httpx

from app.core.config import settings
from app.modules.notifications.repository import DevicePushTokenRepository

logger = logging.getLogger(__name__)

EMERGENCY_CHANNEL_ID = "emergency"
EXPO_PUSH_TOKEN_PREFIX = "ExponentPushToken["


def is_expo_push_token(token: str) -> bool:
    value = (token or "").strip()
    return value.startswith(EXPO_PUSH_TOKEN_PREFIX) and value.endswith("]")


class ExpoPushSender:
    def __init__(self, token_repo: DevicePushTokenRepository):
        self.token_repo = token_repo

    async def send_emergency(
        self,
        *,
        user_ids: Sequence[UUID],
        title: str,
        body: str,
        emergency_id: UUID,
    ) -> int:
        """Send high-priority SOS pushes. Returns number of device messages queued."""
        if not settings.EXPO_PUSH_ENABLED:
            return 0
        tokens = await self.token_repo.list_tokens_for_users(user_ids)
        if not tokens:
            return 0

        messages: list[dict[str, Any]] = []
        for row in tokens:
            if not is_expo_push_token(row.token):
                continue
            messages.append(
                {
                    "to": row.token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                    "priority": "high",
                    "channelId": EMERGENCY_CHANNEL_ID,
                    "data": {
                        "type": "emergency",
                        "emergencyId": str(emergency_id),
                    },
                }
            )
        if not messages:
            return 0
        await self._post_messages(messages)
        return len(messages)

    async def send_messages_for_recipients(
        self,
        *,
        recipients: Sequence[tuple[UUID, str, str]],
        emergency_id: UUID,
    ) -> int:
        """One push per device for each (user_id, title, body) recipient (deduped by user)."""
        if not settings.EXPO_PUSH_ENABLED:
            return 0
        seen: set[UUID] = set()
        unique: list[tuple[UUID, str, str]] = []
        for user_id, title, body in recipients:
            if user_id in seen:
                continue
            seen.add(user_id)
            unique.append((user_id, title, body))

        total = 0
        for user_id, title, body in unique:
            total += await self.send_emergency(
                user_ids=[user_id],
                title=title,
                body=body,
                emergency_id=emergency_id,
            )
        return total

    async def _post_messages(self, messages: list[dict[str, Any]]) -> None:
        url = settings.EXPO_PUSH_URL
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                for start in range(0, len(messages), 100):
                    batch = messages[start : start + 100]
                    response = await client.post(
                        url,
                        json=batch,
                        headers={
                            "Accept": "application/json",
                            "Accept-Encoding": "gzip, deflate",
                            "Content-Type": "application/json",
                        },
                    )
                    if response.status_code >= 400:
                        logger.warning(
                            "Expo push HTTP %s: %s",
                            response.status_code,
                            response.text[:500],
                        )
                        continue
                    await self._handle_tickets(batch, response.json())
        except Exception:
            logger.exception("Failed to send Expo push batch")

    async def _handle_tickets(self, batch: list[dict[str, Any]], payload: Any) -> None:
        data = payload.get("data") if isinstance(payload, dict) else None
        tickets = data if isinstance(data, list) else ([data] if data else [])
        for index, ticket in enumerate(tickets):
            if not isinstance(ticket, dict):
                continue
            if ticket.get("status") != "error":
                continue
            details = ticket.get("details") or {}
            error = details.get("error") if isinstance(details, dict) else None
            if error != "DeviceNotRegistered":
                logger.info("Expo push error: %s", ticket.get("message"))
                continue
            token = batch[index].get("to") if index < len(batch) else None
            if isinstance(token, str):
                await self.token_repo.delete_by_token(token)
                logger.info("Removed unregistered Expo push token")
