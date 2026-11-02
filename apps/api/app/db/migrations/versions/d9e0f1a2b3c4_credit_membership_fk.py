"""allow membership delete after credit allocation

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-10-26
"""

from typing import Sequence, Union

from alembic import op


revision: str = "d9e0f1a2b3c4"
down_revision: Union[str, None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("credit_accounts_membership_id_fkey", "credit_accounts", type_="foreignkey")
    op.create_foreign_key(
        "credit_accounts_membership_id_fkey",
        "credit_accounts",
        "memberships",
        ["membership_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.drop_constraint("credit_transactions_membership_id_fkey", "credit_transactions", type_="foreignkey")
    op.create_foreign_key(
        "credit_transactions_membership_id_fkey",
        "credit_transactions",
        "memberships",
        ["membership_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("credit_transactions_membership_id_fkey", "credit_transactions", type_="foreignkey")
    op.create_foreign_key(
        "credit_transactions_membership_id_fkey",
        "credit_transactions",
        "memberships",
        ["membership_id"],
        ["id"],
    )
    op.drop_constraint("credit_accounts_membership_id_fkey", "credit_accounts", type_="foreignkey")
    op.create_foreign_key(
        "credit_accounts_membership_id_fkey",
        "credit_accounts",
        "memberships",
        ["membership_id"],
        ["id"],
    )
