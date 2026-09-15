from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Enum
import uuid
import enum
from sqlalchemy.sql import func
from app.db.base import Base


class DeliveryStatus(str, enum.Enum):
    PENDING = "PENDING"
    EN_ROUTE = "EN_ROUTE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class StaffDelivery(Base):
    __tablename__ = "staff_deliveries"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    care_manager_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=False, index=True)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"), nullable=True)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    customer_name = Column(String, nullable=True)
    location = Column(String, nullable=True)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.PENDING, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
