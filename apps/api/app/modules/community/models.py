from sqlalchemy import Column, String, DateTime, UUID, Integer, ForeignKey
import uuid
from app.db.base import Base


class CommunityEvent(Base):
    __tablename__ = "community_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    description = Column(String)
    event_date = Column(DateTime(timezone=True))
    capacity = Column(Integer)


class EventRegistration(Base):
    __tablename__ = "event_registrations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("community_events.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(String)
