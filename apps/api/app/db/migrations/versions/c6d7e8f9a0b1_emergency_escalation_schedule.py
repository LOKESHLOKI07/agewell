"""persist SOS escalation due time so restarts cannot drop the ~30s job

Revision ID: c6d7e8f9a0b1
Revises: b5c6d7e8f9a0
Create Date: 2026-09-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c6d7e8f9a0b1"
down_revision: Union[str, None] = "b5c6d7e8f9a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("emergency_cases", sa.Column("escalation_due_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "emergency_cases", sa.Column("escalation_dispatched_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(
        "ix_emergency_cases_escalation_due",
        "emergency_cases",
        ["escalation_due_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_emergency_cases_escalation_due", table_name="emergency_cases")
    op.drop_column("emergency_cases", "escalation_dispatched_at")
    op.drop_column("emergency_cases", "escalation_due_at")
