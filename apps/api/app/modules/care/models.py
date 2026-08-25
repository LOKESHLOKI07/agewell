from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
import uuid
from sqlalchemy.sql import func
from app.db.base import Base

class CareManager(Base):
    __tablename__ = "care_managers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    employee_id = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    skills = Column(String)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
