"""Notification preference helpers. Missing rows default to push/email on, SMS off."""

from __future__ import annotations

from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.models import NotificationPreference


async def ensure_notification_preferences(
    session: AsyncSession, user_id: UUID
) -> NotificationPreference:
    existing = (
        await session.execute(
            select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        )
    ).scalar_one_or_none()
    if existing:
        return existing
    row = NotificationPreference(
        user_id=user_id,
        email_enabled=True,
        push_enabled=True,
        sms_enabled=False,
    )
    session.add(row)
    await session.flush()
    return row


async def get_notification_preferences(
    session: AsyncSession, user_id: UUID
) -> NotificationPreference:
    return await ensure_notification_preferences(session, user_id)


async def update_notification_preferences(
    session: AsyncSession,
    user_id: UUID,
    *,
    email_enabled: Optional[bool] = None,
    push_enabled: Optional[bool] = None,
    sms_enabled: Optional[bool] = None,
) -> NotificationPreference:
    row = await ensure_notification_preferences(session, user_id)
    if email_enabled is not None:
        row.email_enabled = email_enabled
    if push_enabled is not None:
        row.push_enabled = push_enabled
    if sms_enabled is not None:
        row.sms_enabled = sms_enabled
    await session.commit()
    await session.refresh(row)
    return row


async def filter_push_enabled_user_ids(
    session: AsyncSession, user_ids: Sequence[UUID]
) -> list[UUID]:
    """Return user ids that may receive phone push. Missing preference row = allowed."""
    if not user_ids:
        return []
    unique = list(dict.fromkeys(user_ids))
    disabled = set(
        (
            await session.execute(
                select(NotificationPreference.user_id).where(
                    NotificationPreference.user_id.in_(unique),
                    NotificationPreference.push_enabled.is_(False),
                )
            )
        ).scalars().all()
    )
    return [user_id for user_id in unique if user_id not in disabled]
