from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
import uuid
from sqlalchemy.sql import func
from app.db.base import Base


class StaffAttendance(Base):
    __tablename__ = "staff_attendance"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    care_manager_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=False, index=True)
    check_in_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    check_out_at = Column(DateTime(timezone=True), nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
