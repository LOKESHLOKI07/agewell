from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
