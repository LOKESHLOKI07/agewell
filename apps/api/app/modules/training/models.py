from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Enum
import uuid
import enum
from sqlalchemy.sql import func
from app.db.base import Base


class TrainingStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class TrainingModule(Base):
    __tablename__ = "training_modules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    sort_order = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StaffTrainingProgress(Base):
    __tablename__ = "staff_training_progress"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    care_manager_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("training_modules.id"), nullable=False)
    status = Column(Enum(TrainingStatus), default=TrainingStatus.PENDING, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class StaffDocument(Base):
    __tablename__ = "staff_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    care_manager_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    verified = Column(String, nullable=False, default="PENDING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
