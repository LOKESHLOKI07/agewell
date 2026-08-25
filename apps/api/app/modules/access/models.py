from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Enum, Table
import uuid
import enum
from sqlalchemy.sql import func
from app.db.base import Base

class AccessPermission(str, enum.Enum):
    VIEW_PROFILE = "VIEW_PROFILE"
    VIEW_HEALTH = "VIEW_HEALTH"
    VIEW_APPOINTMENTS = "VIEW_APPOINTMENTS"
    VIEW_VISITS = "VIEW_VISITS"
    VIEW_LOCATION = "VIEW_LOCATION"
    VIEW_MEMBERSHIP = "VIEW_MEMBERSHIP"
    VIEW_SERVICE_REQUESTS = "VIEW_SERVICE_REQUESTS"
    RECEIVE_ALERTS = "RECEIVE_ALERTS"

class FamilySeniorAccess(Base):
    __tablename__ = "family_senior_access"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id"))
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
