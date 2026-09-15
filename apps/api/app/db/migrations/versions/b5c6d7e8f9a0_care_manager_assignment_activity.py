"""senior assigned care manager and activity log

Revision ID: b5c6d7e8f9a0
Revises: a9c1e2f3b456
Create Date: 2026-09-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b5c6d7e8f9a0"
down_revision: Union[str, None] = "a9c1e2f3b456"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "seniors",
        sa.Column("care_manager_id", sa.UUID(), nullable=True),
    )
    op.create_index("ix_seniors_care_manager_id", "seniors", ["care_manager_id"], unique=False)
    op.create_foreign_key(
        "fk_seniors_care_manager_id",
        "seniors",
        "care_managers",
        ["care_manager_id"],
        ["id"],
    )
    op.create_table(
        "care_manager_activities",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("senior_id", sa.UUID(), nullable=False),
        sa.Column("care_manager_id", sa.UUID(), nullable=True),
        sa.Column("activity_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("discussion", sa.Text(), nullable=True),
        sa.Column("action_taken", sa.Text(), nullable=True),
        sa.Column("services_coordinated", sa.Text(), nullable=True),
        sa.Column("follow_up_required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("follow_up_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("follow_up_notes", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("visit_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["senior_id"], ["seniors.id"]),
        sa.ForeignKeyConstraint(["care_manager_id"], ["care_managers.id"]),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_care_manager_activities_senior_id",
        "care_manager_activities",
        ["senior_id"],
        unique=False,
    )
    op.create_index(
        "ix_care_manager_activities_care_manager_id",
        "care_manager_activities",
        ["care_manager_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_care_manager_activities_care_manager_id", table_name="care_manager_activities")
    op.drop_index("ix_care_manager_activities_senior_id", table_name="care_manager_activities")
    op.drop_table("care_manager_activities")
    op.drop_constraint("fk_seniors_care_manager_id", "seniors", type_="foreignkey")
    op.drop_index("ix_seniors_care_manager_id", table_name="seniors")
    op.drop_column("seniors", "care_manager_id")
