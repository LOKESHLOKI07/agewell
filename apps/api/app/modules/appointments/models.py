from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Enum
import uuid
import enum
from app.db.base import Base

class AppointmentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_providers.id"))
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.REQUESTED)
    scheduled_at = Column(DateTime(timezone=True))
