from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.notifications.models import NotificationPriority
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import AdminNotificationResponse, MarkAllReadResponse, NotificationResponse
from app.modules.notifications.service import NotificationService
from app.modules.users.models import User

router = APIRouter()


def get_notification_service(db: AsyncSession = Depends(get_db)):
    return NotificationService(NotificationRepository(db))


@router.get("/", response_model=ListPage[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    return await service.list_for_user(
        current_user.id, unread_only=unread_only, limit=limit, offset=offset
    )


@router.get("/admin", response_model=ListPage[AdminNotificationResponse])
async def list_admin_notifications(
    user_id: Optional[UUID] = None,
    priority: Optional[NotificationPriority] = None,
    is_read: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: NotificationService = Depends(get_notification_service),
):
    return await service.list_admin(
        user_id=user_id, priority=priority, is_read=is_read, limit=limit, offset=offset
    )


@router.post("/read-all", response_model=MarkAllReadResponse)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    return await service.mark_all_read(current_user.id)


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    return await service.get_for_user(current_user.id, notification_id)


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    return await service.mark_read(current_user.id, notification_id)
