from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict

from app.modules.notifications.models import NotificationPriority


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    title: Optional[str] = None
    message: Optional[str] = None
    priority: NotificationPriority
    is_read: bool
    created_at: Optional[datetime] = None


class MarkAllReadResponse(BaseModel):
    updated: int


class AdminNotificationResponse(NotificationResponse):
    user_id: Optional[UUID4] = None
