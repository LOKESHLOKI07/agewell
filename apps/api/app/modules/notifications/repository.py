from typing import Optional
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.models import Notification, NotificationPriority


class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(Notification).where(Notification.user_id == user_id)
        count_stmt = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
            count_stmt = count_stmt.where(Notification.is_read.is_(False))
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(Notification.created_at.desc().nulls_last()).offset(offset).limit(limit)
        )
        return result.scalars().all(), int(total)

    async def list_admin(
        self,
        *,
        user_id: Optional[UUID] = None,
        priority: Optional[NotificationPriority] = None,
        is_read: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(Notification)
        count_stmt = select(func.count()).select_from(Notification)
        if user_id is not None:
            stmt = stmt.where(Notification.user_id == user_id)
            count_stmt = count_stmt.where(Notification.user_id == user_id)
        if priority is not None:
            stmt = stmt.where(Notification.priority == priority)
            count_stmt = count_stmt.where(Notification.priority == priority)
        if is_read is not None:
            stmt = stmt.where(Notification.is_read.is_(is_read))
            count_stmt = count_stmt.where(Notification.is_read.is_(is_read))
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(Notification.created_at.desc().nulls_last()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def get_by_id(self, notification_id: UUID) -> Optional[Notification]:
        result = await self.session.execute(select(Notification).where(Notification.id == notification_id))
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        user_id: UUID,
        title: str,
        message: str,
        priority: NotificationPriority,
    ) -> Notification:
        row = Notification(
            user_id=user_id,
            title=title,
            message=message,
            priority=priority,
            is_read=False,
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def mark_read(self, notification: Notification) -> Notification:
        notification.is_read = True
        await self.session.commit()
        await self.session.refresh(notification)
        return notification

    async def mark_all_read(self, user_id: UUID) -> int:
        result = await self.session.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True)
        )
        await self.session.commit()
        return int(result.rowcount or 0)
