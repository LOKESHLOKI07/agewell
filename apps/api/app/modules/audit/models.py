from sqlalchemy import Column, String, DateTime, UUID
import uuid
from sqlalchemy.sql import func
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_name = Column(String)
    entity_id = Column(String)
    action = Column(String)
    changes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
