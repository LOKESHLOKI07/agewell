from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, UUID
import enum
import uuid
from sqlalchemy.sql import func
from app.db.base import Base


# Application / employment status for care associates (string, validated in service).
CARE_STATUS_PENDING = "PENDING"
CARE_STATUS_ACTIVE = "ACTIVE"
CARE_STATUS_REJECTED = "REJECTED"
CARE_STATUS_DISABLED = "DISABLED"
CARE_STATUSES = {
    CARE_STATUS_PENDING,
    CARE_STATUS_ACTIVE,
    CARE_STATUS_REJECTED,
    CARE_STATUS_DISABLED,
}

CARE_STAFF_KIND_CARE_MANAGER = "CARE_MANAGER"
CARE_STAFF_KIND_COMPANION = "COMPANION"
CARE_STAFF_KIND_DELIVERY_EXECUTIVE = "DELIVERY_EXECUTIVE"
CARE_STAFF_KINDS = {
    CARE_STAFF_KIND_CARE_MANAGER,
    CARE_STAFF_KIND_COMPANION,
    CARE_STAFF_KIND_DELIVERY_EXECUTIVE,
}


class CareManager(Base):
    __tablename__ = "care_managers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    employee_id = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    skills = Column(String)
    experience = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    status = Column(String)
    staff_kind = Column(String, nullable=False, default=CARE_STAFF_KIND_CARE_MANAGER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CareActivityType(str, enum.Enum):
    CALL = "CALL"
    MESSAGE = "MESSAGE"
    VISIT = "VISIT"
    HOME_VISIT = "HOME_VISIT"
    HEALTH = "HEALTH"
    MEDICINE = "MEDICINE"
    GROCERY = "GROCERY"
    FOLLOW_UP_CALL = "FOLLOW_UP_CALL"
    EMERGENCY = "EMERGENCY"
    DIGITAL = "DIGITAL"
    TRANSPORT = "TRANSPORT"
    MAINTENANCE = "MAINTENANCE"
    GENERAL = "GENERAL"


class CareActivityStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


ACTIVITY_ICON_BY_TYPE = {
    CareActivityType.CALL: "call-outline",
    CareActivityType.MESSAGE: "chatbubble-outline",
    CareActivityType.VISIT: "calendar-outline",
    CareActivityType.HOME_VISIT: "home-outline",
    CareActivityType.HEALTH: "doctor",
    CareActivityType.MEDICINE: "pill",
    CareActivityType.GROCERY: "cart-outline",
    CareActivityType.FOLLOW_UP_CALL: "call-outline",
    CareActivityType.EMERGENCY: "siren",
    CareActivityType.DIGITAL: "phone-portrait-outline",
    CareActivityType.TRANSPORT: "car-outline",
    CareActivityType.MAINTENANCE: "settings-outline",
    CareActivityType.GENERAL: "clipboard-outline",
}

ACTIVITY_TITLE_BY_TYPE = {
    CareActivityType.CALL: "Care Manager Call",
    CareActivityType.MESSAGE: "WhatsApp Message",
    CareActivityType.VISIT: "Care Manager Visit",
    CareActivityType.HOME_VISIT: "Home Visit Completed",
    CareActivityType.HEALTH: "Doctor Visit Coordinated",
    CareActivityType.MEDICINE: "Medicine Coordinated",
    CareActivityType.GROCERY: "Grocery Coordinated",
    CareActivityType.FOLLOW_UP_CALL: "Follow-up Call",
    CareActivityType.EMERGENCY: "Emergency Support",
    CareActivityType.DIGITAL: "Digital Assistance",
    CareActivityType.TRANSPORT: "Transportation Coordinated",
    CareActivityType.MAINTENANCE: "House Maintenance",
    CareActivityType.GENERAL: "General Care Review",
}


def icon_for_activity_type(activity_type: CareActivityType | str) -> str:
    try:
        typed = activity_type if isinstance(activity_type, CareActivityType) else CareActivityType(str(activity_type))
    except ValueError:
        typed = CareActivityType.GENERAL
    return ACTIVITY_ICON_BY_TYPE[typed]


def title_for_activity_type(activity_type: CareActivityType | str) -> str:
    try:
        typed = activity_type if isinstance(activity_type, CareActivityType) else CareActivityType(str(activity_type))
    except ValueError:
        typed = CareActivityType.GENERAL
    return ACTIVITY_TITLE_BY_TYPE[typed]


class CareManagerActivity(Base):
    __tablename__ = "care_manager_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"), nullable=False, index=True)
    care_manager_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=True, index=True)
    activity_type = Column(String, nullable=False, default=CareActivityType.GENERAL.value)
    status = Column(String, nullable=False, default=CareActivityStatus.REQUESTED.value)
    icon = Column(String, nullable=True)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    reason = Column(Text, nullable=True)
    discussion = Column(Text, nullable=True)
    action_taken = Column(Text, nullable=True)
    services_coordinated = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, nullable=False, default=False)
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    follow_up_notes = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
