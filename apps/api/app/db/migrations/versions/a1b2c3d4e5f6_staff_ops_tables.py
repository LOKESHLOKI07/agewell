"""staff ops tables

Revision ID: a1b2c3d4e5f6
Revises: f8a2b3c4d567
Create Date: 2026-09-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f8a2b3c4d567"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("visits", sa.Column("started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("visits", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "staff_attendance",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("care_manager_id", sa.UUID(), nullable=False),
        sa.Column("check_in_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("check_out_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["care_manager_id"], ["care_managers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_staff_attendance_care_manager_id", "staff_attendance", ["care_manager_id"])

    delivery_status = sa.Enum("PENDING", "EN_ROUTE", "COMPLETED", "FAILED", name="deliverystatus", create_type=False)
    op.execute("DO $$ BEGIN CREATE TYPE deliverystatus AS ENUM ('PENDING', 'EN_ROUTE', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.create_table(
        "staff_deliveries",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("care_manager_id", sa.UUID(), nullable=False),
        sa.Column("senior_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("customer_name", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("status", delivery_status, nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["care_manager_id"], ["care_managers.id"]),
        sa.ForeignKeyConstraint(["senior_id"], ["seniors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_staff_deliveries_care_manager_id", "staff_deliveries", ["care_manager_id"])

    op.create_table(
        "training_modules",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("sort_order", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    training_status = sa.Enum("PENDING", "IN_PROGRESS", "COMPLETED", name="trainingstatus", create_type=False)
    op.execute("DO $$ BEGIN CREATE TYPE trainingstatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.create_table(
        "staff_training_progress",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("care_manager_id", sa.UUID(), nullable=False),
        sa.Column("module_id", sa.UUID(), nullable=False),
        sa.Column("status", training_status, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["care_manager_id"], ["care_managers.id"]),
        sa.ForeignKeyConstraint(["module_id"], ["training_modules.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_staff_training_progress_care_manager_id", "staff_training_progress", ["care_manager_id"])

    op.create_table(
        "staff_documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("care_manager_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("verified", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["care_manager_id"], ["care_managers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_staff_documents_care_manager_id", "staff_documents", ["care_manager_id"])


def downgrade() -> None:
    op.drop_index("ix_staff_documents_care_manager_id", table_name="staff_documents")
    op.drop_table("staff_documents")
    op.drop_index("ix_staff_training_progress_care_manager_id", table_name="staff_training_progress")
    op.drop_table("staff_training_progress")
    op.drop_table("training_modules")
    sa.Enum(name="trainingstatus").drop(op.get_bind(), checkfirst=True)
    op.drop_index("ix_staff_deliveries_care_manager_id", table_name="staff_deliveries")
    op.drop_table("staff_deliveries")
    sa.Enum(name="deliverystatus").drop(op.get_bind(), checkfirst=True)
    op.drop_index("ix_staff_attendance_care_manager_id", table_name="staff_attendance")
    op.drop_table("staff_attendance")
    op.drop_column("visits", "completed_at")
    op.drop_column("visits", "started_at")
