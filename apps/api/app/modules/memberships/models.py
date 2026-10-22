from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Numeric
import uuid
from sqlalchemy.sql import func
from app.db.base import Base

class MembershipPlan(Base):
    __tablename__ = "membership_plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    price = Column(Numeric(10, 2))

class Membership(Base):
    __tablename__ = "memberships"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    plan_id = Column(UUID(as_uuid=True), ForeignKey("membership_plans.id"))
    start_date = Column(DateTime)
    end_date = Column(DateTime)

from sqlalchemy import Integer
class MembershipBenefit(Base):
    __tablename__ = "membership_benefits"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("membership_plans.id"))
    benefit_name = Column(String)
    quota = Column(Integer)

class MembershipUsageLedger(Base):
    __tablename__ = "membership_usage_ledger"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    membership_id = Column(UUID(as_uuid=True), ForeignKey("memberships.id"))
    benefit_id = Column(UUID(as_uuid=True), ForeignKey("membership_benefits.id"))
    used_amount = Column(Integer)
    date_used = Column(DateTime, server_default=func.now())


# Application workflow stages (admin advances these one by one).
STAGE_SUBMITTED = "SUBMITTED"
STAGE_VISIT_PLANNED = "VISIT_PLANNED"
STAGE_VISIT_SCHEDULED = "VISIT_SCHEDULED"
STAGE_VISIT_COMPLETED = "VISIT_COMPLETED"
STAGE_IN_REVIEW = "IN_REVIEW"
STAGE_ACCEPTED = "ACCEPTED"
STAGE_APPROVED = "APPROVED"  # paid / membership activated
STAGE_REJECTED = "REJECTED"

APPLICATION_STAGES = {
    STAGE_SUBMITTED,
    STAGE_VISIT_PLANNED,
    STAGE_VISIT_SCHEDULED,
    STAGE_VISIT_COMPLETED,
    STAGE_IN_REVIEW,
    STAGE_ACCEPTED,
    STAGE_APPROVED,
    STAGE_REJECTED,
}

STAGE_ORDER = [
    STAGE_SUBMITTED,
    STAGE_VISIT_PLANNED,
    STAGE_VISIT_SCHEDULED,
    STAGE_VISIT_COMPLETED,
    STAGE_IN_REVIEW,
    STAGE_ACCEPTED,
    STAGE_APPROVED,
]


class MembershipRequest(Base):
    """Family/senior membership application. Admin advances stage; pay activates membership."""

    __tablename__ = "membership_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("membership_plans.id"), nullable=False)
    status = Column(String, nullable=False, default="REQUESTED")  # REQUESTED | APPROVED | REJECTED
    stage = Column(String, nullable=False, default=STAGE_SUBMITTED)
    notes = Column(String, nullable=True)
    family_contact_1_name = Column(String, nullable=True)
    family_contact_1_phone = Column(String, nullable=True)
    family_contact_2_name = Column(String, nullable=True)
    family_contact_2_phone = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    preferred_hospital = Column(String, nullable=True)
    visit_planned_at = Column(DateTime(timezone=True), nullable=True)
    visit_scheduled_start = Column(DateTime(timezone=True), nullable=True)
    visit_scheduled_end = Column(DateTime(timezone=True), nullable=True)
    visit_completed_at = Column(DateTime(timezone=True), nullable=True)
    review_completed_at = Column(DateTime(timezone=True), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    care_manager_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=True)
    companion_id = Column(UUID(as_uuid=True), ForeignKey("care_managers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
