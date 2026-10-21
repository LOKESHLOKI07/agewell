"""membership application workflow stages

Revision ID: a3b4c5d6e789
Revises: e1f2a3b4c5d6
Create Date: 2026-09-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a3b4c5d6e789"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "membership_requests",
        sa.Column("stage", sa.String(), nullable=False, server_default="SUBMITTED"),
    )
    op.add_column("membership_requests", sa.Column("visit_planned_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "membership_requests",
        sa.Column("visit_scheduled_start", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "membership_requests",
        sa.Column("visit_scheduled_end", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "membership_requests",
        sa.Column("visit_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "membership_requests",
        sa.Column("review_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("membership_requests", sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("membership_requests", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "membership_requests",
        sa.Column("care_manager_id", sa.UUID(), sa.ForeignKey("care_managers.id"), nullable=True),
    )
    op.add_column(
        "membership_requests",
        sa.Column("companion_id", sa.UUID(), sa.ForeignKey("care_managers.id"), nullable=True),
    )
    op.create_index("ix_membership_requests_stage", "membership_requests", ["stage"])


def downgrade() -> None:
    op.drop_index("ix_membership_requests_stage", table_name="membership_requests")
    op.drop_column("membership_requests", "companion_id")
    op.drop_column("membership_requests", "care_manager_id")
    op.drop_column("membership_requests", "paid_at")
    op.drop_column("membership_requests", "accepted_at")
    op.drop_column("membership_requests", "review_completed_at")
    op.drop_column("membership_requests", "visit_completed_at")
    op.drop_column("membership_requests", "visit_scheduled_end")
    op.drop_column("membership_requests", "visit_scheduled_start")
    op.drop_column("membership_requests", "visit_planned_at")
    op.drop_column("membership_requests", "stage")
