from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Enum
import uuid
import enum
from sqlalchemy.sql import func
from app.db.base import Base

class VisitStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    CHECKED_IN = "CHECKED_IN"
    IN_PROGRESS = "IN_PROGRESS"
    CHECKED_OUT = "CHECKED_OUT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class Visit(Base):
    __tablename__ = "visits"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    care_manager_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=True)
    status = Column(Enum(VisitStatus), default=VisitStatus.SCHEDULED)
    scheduled_at = Column(DateTime(timezone=True))
    notes = Column(String)

from sqlalchemy import Boolean
class VisitTask(Base):
    __tablename__ = "visit_tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"))
    task_name = Column(String)
    is_completed = Column(Boolean, default=False)

class VisitReport(Base):
    __tablename__ = "visit_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"))
    summary = Column(String)
    issues_noted = Column(String)
