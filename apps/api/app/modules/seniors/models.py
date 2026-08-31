from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Date, Text
import uuid
from sqlalchemy.sql import func
from app.db.base import Base

class Senior(Base):
    __tablename__ = "seniors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    first_name = Column(String)
    last_name = Column(String)
    date_of_birth = Column(Date)
    address = Column(String)
    emergency_contact = Column(String)
    preferred_language = Column(String, nullable=True)
    photo = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
