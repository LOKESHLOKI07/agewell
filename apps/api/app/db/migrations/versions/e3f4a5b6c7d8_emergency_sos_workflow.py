"""emergency SOS workflow: case numbers, recipients, report timestamps

Revision ID: e3f4a5b6c7d8
Revises: d1e2f3a4b5c6
Create Date: 2026-09-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("emergency_cases", sa.Column("case_number", sa.String(), nullable=True))
    op.add_column("emergency_cases", sa.Column("trigger_source", sa.String(), nullable=True))
    op.add_column("emergency_cases", sa.Column("location_text", sa.String(), nullable=True))
    op.add_column("emergency_cases", sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emergency_cases", sa.Column("alert_sent_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emergency_cases", sa.Column("assistance_started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emergency_cases", sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emergency_cases", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emergency_cases", sa.Column("handled_by_user_id", sa.UUID(), nullable=True))
    op.add_column("emergency_cases", sa.Column("emergency_reason", sa.String(), nullable=True))
    op.add_column("emergency_cases", sa.Column("what_happened", sa.Text(), nullable=True))
    op.add_column("emergency_cases", sa.Column("action_taken", sa.Text(), nullable=True))
    op.add_column("emergency_cases", sa.Column("hospital_required", sa.Boolean(), nullable=True))
    op.add_column("emergency_cases", sa.Column("hospital_details", sa.Text(), nullable=True))
    op.add_column("emergency_cases", sa.Column("family_communication", sa.Text(), nullable=True))
    op.add_column("emergency_cases", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column("emergency_cases", sa.Column("follow_up_required", sa.Boolean(), nullable=True))
    op.add_column("emergency_cases", sa.Column("follow_up_date", sa.Date(), nullable=True))
    op.create_foreign_key(
        "fk_emergency_cases_handled_by_user_id",
        "emergency_cases",
        "users",
        ["handled_by_user_id"],
        ["id"],
    )
    op.create_index("ix_emergency_cases_case_number", "emergency_cases", ["case_number"], unique=True)

    op.execute(
        """
        UPDATE emergency_cases
        SET
            case_number = 'AW-EMG-' || TO_CHAR(COALESCE(created_at, NOW()), 'YYYY') || '-' || LPAD(CAST(row_num AS text), 6, '0'),
            trigger_source = COALESCE(trigger_source, 'APP_SOS'),
            triggered_at = COALESCE(triggered_at, created_at, NOW())
        FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM COALESCE(created_at, NOW())) ORDER BY created_at) AS row_num
            FROM emergency_cases
        ) numbered
        WHERE emergency_cases.id = numbered.id
        """
    )

    op.create_table(
        "emergency_recipients",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("case_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("responded_by_user_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["emergency_cases.id"]),
        sa.ForeignKeyConstraint(["responded_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_emergency_recipients_case_id", "emergency_recipients", ["case_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_emergency_recipients_case_id", table_name="emergency_recipients")
    op.drop_table("emergency_recipients")
    op.drop_constraint("fk_emergency_cases_handled_by_user_id", "emergency_cases", type_="foreignkey")
    op.drop_index("ix_emergency_cases_case_number", table_name="emergency_cases")
    op.drop_column("emergency_cases", "follow_up_date")
    op.drop_column("emergency_cases", "follow_up_required")
    op.drop_column("emergency_cases", "notes")
    op.drop_column("emergency_cases", "family_communication")
    op.drop_column("emergency_cases", "hospital_details")
    op.drop_column("emergency_cases", "hospital_required")
    op.drop_column("emergency_cases", "action_taken")
    op.drop_column("emergency_cases", "what_happened")
    op.drop_column("emergency_cases", "emergency_reason")
    op.drop_column("emergency_cases", "handled_by_user_id")
    op.drop_column("emergency_cases", "closed_at")
    op.drop_column("emergency_cases", "resolved_at")
    op.drop_column("emergency_cases", "assistance_started_at")
    op.drop_column("emergency_cases", "alert_sent_at")
    op.drop_column("emergency_cases", "triggered_at")
    op.drop_column("emergency_cases", "location_text")
    op.drop_column("emergency_cases", "trigger_source")
    op.drop_column("emergency_cases", "case_number")
