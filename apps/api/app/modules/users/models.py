from sqlalchemy import Column, String, DateTime, Enum, UUID
import uuid
import enum
from sqlalchemy.sql import func
from app.db.base import Base

class RoleEnum(str, enum.Enum):
    SENIOR = "SENIOR"
    FAMILY = "FAMILY"
    CARE_MANAGER = "CARE_MANAGER"
    ADMIN = "ADMIN"
    OPERATIONS = "OPERATIONS"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.FAMILY)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
