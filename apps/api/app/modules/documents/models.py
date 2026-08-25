from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
import uuid
from sqlalchemy.sql import func
from app.db.base import Base

class DocumentMetadata(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    filename = Column(String)
    content_type = Column(String)
    storage_key = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
