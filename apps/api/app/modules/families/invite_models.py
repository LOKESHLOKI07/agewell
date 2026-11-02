import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, UUID
from sqlalchemy.sql import func

from app.db.base import Base


class FamilyInviteStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


class FamilyInvite(Base):
    __tablename__ = "family_invites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"), nullable=False, index=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    relationship = Column(String, nullable=False)
    status = Column(
        Enum(FamilyInviteStatus),
        nullable=False,
        default=FamilyInviteStatus.PENDING,
        index=True,
    )
    invited_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    access_id = Column(UUID(as_uuid=True), ForeignKey("family_senior_access.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
