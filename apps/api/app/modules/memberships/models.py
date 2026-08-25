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
