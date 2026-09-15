from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Enum, Boolean
import uuid
import enum
from sqlalchemy.sql import func
from app.db.base import Base

class NotificationPriority(str, enum.Enum):
    INFO = "INFO"
    IMPORTANT = "IMPORTANT"
    EMERGENCY = "EMERGENCY"

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String)
    message = Column(String)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.INFO)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    email_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)


class DevicePushToken(Base):
    """Expo push tokens; Expo Push Service delivers via FCM (Android) and APNs (iOS)."""

    __tablename__ = "device_push_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False)
    platform = Column(String, nullable=False)  # ios | android | web
    app_variant = Column(String, nullable=True)  # family | care
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
