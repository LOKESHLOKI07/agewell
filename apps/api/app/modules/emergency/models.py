from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, String, Text, UUID
from sqlalchemy.orm import relationship
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


ACTIVE_EMERGENCY_STATUSES = (
    EmergencyStatus.OPEN,
    EmergencyStatus.ACKNOWLEDGED,
    EmergencyStatus.ASSIGNED,
    EmergencyStatus.IN_PROGRESS,
)


TRIGGER_APP_SOS = "APP_SOS"
TRIGGER_HOME_PANIC = "HOME_PANIC_BUTTON"
TRIGGER_SOURCES = {TRIGGER_APP_SOS, TRIGGER_HOME_PANIC}

RECIPIENT_FAMILY = "FAMILY"
RECIPIENT_CARE_MANAGER = "CARE_MANAGER"
RECIPIENT_COMPANION = "COMPANION"
RECIPIENT_AGEWELL_SUPPORT = "AGEWELL_SUPPORT"
RECIPIENT_ROLES = (
    RECIPIENT_FAMILY,
    RECIPIENT_CARE_MANAGER,
    RECIPIENT_COMPANION,
    RECIPIENT_AGEWELL_SUPPORT,
)

RECIPIENT_PENDING = "PENDING"
RECIPIENT_RESPONDED = "RESPONDED"
RECIPIENT_STATUSES = {RECIPIENT_PENDING, RECIPIENT_RESPONDED}

RECIPIENT_LABELS = {
    RECIPIENT_FAMILY: "Family Member",
    RECIPIENT_CARE_MANAGER: "Care Manager",
    RECIPIENT_COMPANION: "Companion",
    RECIPIENT_AGEWELL_SUPPORT: "AgeWell Support",
}


class EmergencyCase(Base):
    __tablename__ = "emergency_cases"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    type = Column(Enum(EmergencyType))
    status = Column(Enum(EmergencyStatus), default=EmergencyStatus.OPEN)
    case_number = Column(String, unique=True, index=True)
    trigger_source = Column(String, default=TRIGGER_APP_SOS)
    location_text = Column(String, nullable=True)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    alert_sent_at = Column(DateTime(timezone=True), nullable=True)
    assistance_started_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    handled_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    emergency_reason = Column(String, nullable=True)
    what_happened = Column(Text, nullable=True)
    action_taken = Column(Text, nullable=True)
    hospital_required = Column(Boolean, nullable=True)
    hospital_details = Column(Text, nullable=True)
    family_communication = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    # Durable SOS escalation schedule. Survives API process restart (see escalation.py).
    escalation_due_at = Column(DateTime(timezone=True), nullable=True)
    escalation_dispatched_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recipients = relationship(
        "EmergencyRecipient",
        back_populates="case",
        cascade="all, delete-orphan",
    )


class EmergencyRecipient(Base):
    __tablename__ = "emergency_recipients"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("emergency_cases.id"), nullable=False, index=True)
    role = Column(String, nullable=False)
    status = Column(String, nullable=False, default=RECIPIENT_PENDING)
    notified_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    responded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("EmergencyCase", back_populates="recipients")


class EmergencyEvent(Base):
    __tablename__ = "emergency_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("emergency_cases.id"))
    event_description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
