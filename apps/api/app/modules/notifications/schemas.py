from datetime import datetime
from typing import Literal, Optional

from pydantic import UUID4, BaseModel, ConfigDict, Field

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


class DevicePushTokenRegister(BaseModel):
    token: str = Field(min_length=20, max_length=512)
    platform: Literal["ios", "android", "web"]
    app_variant: Optional[Literal["family", "care"]] = None


class DevicePushTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    token: str
    platform: str
    app_variant: Optional[str] = None
    updated_at: Optional[datetime] = None


class DevicePushTokenUnregister(BaseModel):
    token: str = Field(min_length=20, max_length=512)
