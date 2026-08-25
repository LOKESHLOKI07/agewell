from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Enum
import uuid
import enum
from sqlalchemy.sql import func
from app.db.base import Base

class EmergencyType(str, enum.Enum):
    MEDICAL = "MEDICAL"
    HOSPITAL = "HOSPITAL"
    CARE_MANAGER = "CARE_MANAGER"
    AGEWELL_SUPPORT = "AGEWELL_SUPPORT"

class EmergencyStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"

class EmergencyCase(Base):
    __tablename__ = "emergency_cases"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    type = Column(Enum(EmergencyType))
    status = Column(Enum(EmergencyStatus), default=EmergencyStatus.OPEN)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EmergencyEvent(Base):
    __tablename__ = "emergency_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("emergency_cases.id"))
    event_description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
