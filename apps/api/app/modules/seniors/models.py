from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Date, Text, Boolean, Float
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
    family_contact_1_name = Column(String, nullable=True)
    family_contact_1_phone = Column(String, nullable=True)
    family_contact_2_name = Column(String, nullable=True)
    family_contact_2_phone = Column(String, nullable=True)
    preferred_hospital = Column(String, nullable=True)
    preferred_language = Column(String, nullable=True)
    membership_kind = Column(String, nullable=True)  # single | couple
    # Explicit location check result; None = fall back to address keywords.
    in_service_area = Column(Boolean, nullable=True)
    care_manager_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=True, index=True)
    # Last location check: GPS pin and/or manually typed place.
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    location_query = Column(String, nullable=True)
    location_source = Column(String, nullable=True)  # gps | manual
    photo = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
