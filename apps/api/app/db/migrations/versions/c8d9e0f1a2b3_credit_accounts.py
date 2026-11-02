"""credit accounts, ledger, and service expenses

Revision ID: c8d9e0f1a2b3
Revises: b4c5d6e7f890
Create Date: 2026-10-26
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, None] = "b4c5d6e7f890"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "membership_plans",
        sa.Column("initial_service_credit", sa.Numeric(12, 2), nullable=True),
    )
    op.add_column(
        "membership_plans",
        sa.Column("initial_emergency_credit", sa.Numeric(12, 2), nullable=True),
    )
    op.execute(
        "UPDATE membership_plans SET initial_service_credit = 2500.00 WHERE initial_service_credit IS NULL"
    )
    op.execute(
        "UPDATE membership_plans SET initial_emergency_credit = 15000.00 WHERE initial_emergency_credit IS NULL"
    )

    op.create_table(
        "credit_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("senior_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("allocated_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("available_balance", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("membership_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["membership_id"], ["memberships.id"]),
        sa.ForeignKeyConstraint(["senior_id"], ["seniors.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("senior_id", "category", name="uq_credit_accounts_senior_category"),
    )
    op.create_index("ix_credit_accounts_senior_id", "credit_accounts", ["senior_id"])

    op.create_table(
        "service_expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("senior_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("service_request_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("emergency_case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("receipt_document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("submitted_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reviewed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["emergency_case_id"], ["emergency_cases.id"]),
        sa.ForeignKeyConstraint(["receipt_document_id"], ["documents.id"]),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["senior_id"], ["seniors.id"]),
        sa.ForeignKeyConstraint(["service_request_id"], ["service_requests.id"]),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_service_expenses_senior_id", "service_expenses", ["senior_id"])
    op.create_index("ix_service_expenses_status", "service_expenses", ["status"])
    op.create_index("ix_service_expenses_service_request_id", "service_expenses", ["service_request_id"])
    op.create_index("ix_service_expenses_emergency_case_id", "service_expenses", ["emergency_case_id"])
    op.create_index(
        "uq_service_expenses_open_request",
        "service_expenses",
        ["service_request_id"],
        unique=True,
        postgresql_where=sa.text("service_request_id IS NOT NULL AND status IN ('PENDING', 'APPROVED')"),
    )
    op.create_index(
        "uq_service_expenses_open_emergency",
        "service_expenses",
        ["emergency_case_id"],
        unique=True,
        postgresql_where=sa.text("emergency_case_id IS NOT NULL AND status IN ('PENDING', 'APPROVED')"),
    )

    op.create_table(
        "credit_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("senior_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("transaction_type", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("membership_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("service_request_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("emergency_case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("expense_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("approved_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["credit_accounts.id"]),
        sa.ForeignKeyConstraint(["approved_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["emergency_case_id"], ["emergency_cases.id"]),
        sa.ForeignKeyConstraint(["expense_id"], ["service_expenses.id"]),
        sa.ForeignKeyConstraint(["membership_id"], ["memberships.id"]),
        sa.ForeignKeyConstraint(["senior_id"], ["seniors.id"]),
        sa.ForeignKeyConstraint(["service_request_id"], ["service_requests.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_credit_transactions_senior_id", "credit_transactions", ["senior_id"])
    op.create_index("ix_credit_transactions_account_id", "credit_transactions", ["account_id"])
    op.create_index(
        "uq_credit_tx_allocation",
        "credit_transactions",
        ["senior_id", "category"],
        unique=True,
        postgresql_where=sa.text("transaction_type = 'ALLOCATION'"),
    )
    op.create_index(
        "uq_credit_tx_expense_deduction",
        "credit_transactions",
        ["expense_id"],
        unique=True,
        postgresql_where=sa.text("expense_id IS NOT NULL AND transaction_type = 'DEDUCTION'"),
    )


def downgrade() -> None:
    op.drop_index("uq_credit_tx_expense_deduction", table_name="credit_transactions")
    op.drop_index("uq_credit_tx_allocation", table_name="credit_transactions")
    op.drop_index("ix_credit_transactions_account_id", table_name="credit_transactions")
    op.drop_index("ix_credit_transactions_senior_id", table_name="credit_transactions")
    op.drop_table("credit_transactions")

    op.drop_index("uq_service_expenses_open_emergency", table_name="service_expenses")
    op.drop_index("uq_service_expenses_open_request", table_name="service_expenses")
    op.drop_index("ix_service_expenses_emergency_case_id", table_name="service_expenses")
    op.drop_index("ix_service_expenses_service_request_id", table_name="service_expenses")
    op.drop_index("ix_service_expenses_status", table_name="service_expenses")
    op.drop_index("ix_service_expenses_senior_id", table_name="service_expenses")
    op.drop_table("service_expenses")

    op.drop_index("ix_credit_accounts_senior_id", table_name="credit_accounts")
    op.drop_table("credit_accounts")

    op.drop_column("membership_plans", "initial_emergency_credit")
    op.drop_column("membership_plans", "initial_service_credit")
