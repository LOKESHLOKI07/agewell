from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.notifications.models import NotificationPriority
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import AdminNotificationResponse, MarkAllReadResponse, NotificationResponse

FORBIDDEN = "You don't have permission to access this information."


class NotificationService:
    def __init__(self, repo: NotificationRepository):
        self.repo = repo

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[NotificationResponse]:
        rows, total = await self.repo.list_for_user(
            user_id, unread_only=unread_only, limit=limit, offset=offset
        )
        return ListPage(
            items=[NotificationResponse.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_for_user(self, user_id: UUID, notification_id: UUID) -> NotificationResponse:
        row = await self._owned_notification(user_id, notification_id)
        return NotificationResponse.model_validate(row)

    async def mark_read(self, user_id: UUID, notification_id: UUID) -> NotificationResponse:
        row = await self._owned_notification(user_id, notification_id)
        if not row.is_read:
            row = await self.repo.mark_read(row)
        return NotificationResponse.model_validate(row)

    async def mark_all_read(self, user_id: UUID) -> MarkAllReadResponse:
        updated = await self.repo.mark_all_read(user_id)
        return MarkAllReadResponse(updated=updated)

    async def list_admin(
        self,
        *,
        user_id: Optional[UUID] = None,
        priority: Optional[NotificationPriority] = None,
        is_read: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[AdminNotificationResponse]:
        rows, total = await self.repo.list_admin(
            user_id=user_id, priority=priority, is_read=is_read, limit=limit, offset=offset
        )
        return ListPage(
            items=[AdminNotificationResponse.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def _owned_notification(self, user_id: UUID, notification_id: UUID):
        row = await self.repo.get_by_id(notification_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        if row.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        return row
