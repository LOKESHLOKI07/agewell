"""membership purchase requests

Revision ID: e7f0a1b2c345
Revises: d6e9f1a2b034
Create Date: 2026-09-01
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7f0a1b2c345"
down_revision: Union[str, None] = "d6e9f1a2b034"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "membership_requests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("senior_id", sa.UUID(), nullable=False),
        sa.Column("plan_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="REQUESTED"),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["senior_id"], ["seniors.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["membership_plans.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_membership_requests_senior_status",
        "membership_requests",
        ["senior_id", "status"],
    )


def downgrade() -> None:
    op.drop_index("ix_membership_requests_senior_status", table_name="membership_requests")
    op.drop_table("membership_requests")
