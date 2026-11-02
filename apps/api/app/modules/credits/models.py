from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base import Base

CATEGORY_SERVICE = "SERVICE"
CATEGORY_EMERGENCY = "EMERGENCY"
CREDIT_CATEGORIES = (CATEGORY_SERVICE, CATEGORY_EMERGENCY)

TX_ALLOCATION = "ALLOCATION"
TX_DEDUCTION = "DEDUCTION"
TX_TYPES = (TX_ALLOCATION, TX_DEDUCTION)

TX_COMPLETED = "COMPLETED"
TX_STATUSES = (TX_COMPLETED,)

EXPENSE_PENDING = "PENDING"
EXPENSE_APPROVED = "APPROVED"
EXPENSE_REJECTED = "REJECTED"
EXPENSE_STATUSES = (EXPENSE_PENDING, EXPENSE_APPROVED, EXPENSE_REJECTED)


class CreditAccount(Base):
    __tablename__ = "credit_accounts"
    __table_args__ = (UniqueConstraint("senior_id", "category", name="uq_credit_accounts_senior_category"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"), nullable=False, index=True)
    category = Column(String(20), nullable=False)
    allocated_amount = Column(Numeric(12, 2), nullable=False)
    available_balance = Column(Numeric(12, 2), nullable=False)
    membership_id = Column(UUID(as_uuid=True), ForeignKey("memberships.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("credit_accounts.id"), nullable=False, index=True)
    category = Column(String(20), nullable=False)
    transaction_type = Column(String(20), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), nullable=False, default=TX_COMPLETED)
    description = Column(String(500), nullable=True)
    membership_id = Column(UUID(as_uuid=True), ForeignKey("memberships.id"), nullable=True)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id"), nullable=True)
    emergency_case_id = Column(UUID(as_uuid=True), ForeignKey("emergency_cases.id"), nullable=True)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("service_expenses.id"), nullable=True)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ServiceExpense(Base):
    __tablename__ = "service_expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"), nullable=False, index=True)
    category = Column(String(20), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default=EXPENSE_PENDING, index=True)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id"), nullable=True, index=True)
    emergency_case_id = Column(UUID(as_uuid=True), ForeignKey("emergency_cases.id"), nullable=True, index=True)
    receipt_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    submitted_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
