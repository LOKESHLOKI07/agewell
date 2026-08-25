"""registration account status and profile fields

Revision ID: c3f1a8b2e901
Revises: a1c4e7b2d890
Create Date: 2026-08-25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3f1a8b2e901"
down_revision: Union[str, None] = "a1c4e7b2d890"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

account_status_enum = sa.Enum(
    "PENDING",
    "ACTIVE",
    "REJECTED",
    "DISABLED",
    name="accountstatus",
)


def upgrade() -> None:
    account_status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column(
            "account_status",
            account_status_enum,
            nullable=False,
            server_default="ACTIVE",
        ),
    )
    op.add_column("family_members", sa.Column("relationship", sa.String(), nullable=True))
    op.add_column(
        "family_members",
        sa.Column("requested_senior_reference", sa.String(), nullable=True),
    )
    op.add_column("care_managers", sa.Column("experience", sa.String(), nullable=True))
    op.add_column("care_managers", sa.Column("languages", sa.String(), nullable=True))
    op.add_column("care_managers", sa.Column("availability", sa.String(), nullable=True))
    op.execute(
        "UPDATE care_managers SET status = 'ACTIVE' WHERE status IS NULL OR status = ''"
    )


def downgrade() -> None:
    op.drop_column("care_managers", "availability")
    op.drop_column("care_managers", "languages")
    op.drop_column("care_managers", "experience")
    op.drop_column("family_members", "requested_senior_reference")
    op.drop_column("family_members", "relationship")
    op.drop_column("users", "account_status")
    account_status_enum.drop(op.get_bind(), checkfirst=True)
