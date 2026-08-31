from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Date
import uuid
from sqlalchemy.sql import func
from app.db.base import Base


class FamilyMember(Base):
    __tablename__ = "family_members"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    first_name = Column(String)
    last_name = Column(String)
    relationship = Column(String, nullable=True)
    requested_senior_reference = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(String, nullable=True)
    preferred_language = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
