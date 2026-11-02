"""family invites for senior-led OTP onboarding

Revision ID: j7f8a9b0c1d2
Revises: i6e7f8a9b0c1
Create Date: 2026-11-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "j7f8a9b0c1d2"
down_revision: Union[str, None] = "i6e7f8a9b0c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "family_invites",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("senior_id", sa.UUID(), sa.ForeignKey("seniors.id"), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("first_name", sa.String(), nullable=False),
        sa.Column("last_name", sa.String(), nullable=False),
        sa.Column("relationship", sa.String(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "ACCEPTED", "REVOKED", "EXPIRED", name="familyinvitestatus"),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("invited_user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("access_id", sa.UUID(), sa.ForeignKey("family_senior_access.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_family_invites_senior_id", "family_invites", ["senior_id"])
    op.create_index("ix_family_invites_email", "family_invites", ["email"])
    op.create_index("ix_family_invites_phone", "family_invites", ["phone"])
    op.create_index("ix_family_invites_status", "family_invites", ["status"])


def downgrade() -> None:
    op.drop_index("ix_family_invites_status", table_name="family_invites")
    op.drop_index("ix_family_invites_phone", table_name="family_invites")
    op.drop_index("ix_family_invites_email", table_name="family_invites")
    op.drop_index("ix_family_invites_senior_id", table_name="family_invites")
    op.drop_table("family_invites")
    op.execute("DROP TYPE IF EXISTS familyinvitestatus")
