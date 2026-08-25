from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
import uuid
from app.db.base import Base


class LocationSession(Base):
    __tablename__ = "location_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class LocationPoint(Base):
    __tablename__ = "location_points"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("location_sessions.id"))
    latitude = Column(String)
    longitude = Column(String)
    timestamp = Column(DateTime)
