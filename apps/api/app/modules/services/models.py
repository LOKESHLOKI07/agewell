from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Enum
import uuid
import enum
from sqlalchemy.sql import func
from app.db.base import Base

class ServiceCategory(str, enum.Enum):
    CARE = "CARE"
    FOOD_HOME = "FOOD_HOME"
    HEALTH = "HEALTH"
    MOBILITY = "MOBILITY"
    COMMUNITY = "COMMUNITY"
    ADD_ON = "ADD_ON"

class Service(Base):
    __tablename__ = "services"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    category = Column(Enum(ServiceCategory))
    description = Column(String)

class ServiceRequestStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    ASSIGNED = "ASSIGNED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"))
    status = Column(Enum(ServiceRequestStatus), default=ServiceRequestStatus.REQUESTED)
