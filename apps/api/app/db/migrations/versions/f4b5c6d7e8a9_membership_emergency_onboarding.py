"""membership emergency onboarding: family contacts and preferred hospital

Revision ID: f4b5c6d7e8a9
Revises: e3f4a5b6c7d8
Create Date: 2026-09-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f4b5c6d7e8a9"
down_revision: Union[str, None] = "e3f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seniors", sa.Column("family_contact_1_name", sa.String(), nullable=True))
    op.add_column("seniors", sa.Column("family_contact_1_phone", sa.String(), nullable=True))
    op.add_column("seniors", sa.Column("family_contact_2_name", sa.String(), nullable=True))
    op.add_column("seniors", sa.Column("family_contact_2_phone", sa.String(), nullable=True))
    op.add_column("seniors", sa.Column("preferred_hospital", sa.String(), nullable=True))

    op.add_column("membership_requests", sa.Column("family_contact_1_name", sa.String(), nullable=True))
    op.add_column("membership_requests", sa.Column("family_contact_1_phone", sa.String(), nullable=True))
    op.add_column("membership_requests", sa.Column("family_contact_2_name", sa.String(), nullable=True))
    op.add_column("membership_requests", sa.Column("family_contact_2_phone", sa.String(), nullable=True))
    op.add_column("membership_requests", sa.Column("preferred_hospital", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("membership_requests", "preferred_hospital")
    op.drop_column("membership_requests", "family_contact_2_phone")
    op.drop_column("membership_requests", "family_contact_2_name")
    op.drop_column("membership_requests", "family_contact_1_phone")
    op.drop_column("membership_requests", "family_contact_1_name")

    op.drop_column("seniors", "preferred_hospital")
    op.drop_column("seniors", "family_contact_2_phone")
    op.drop_column("seniors", "family_contact_2_name")
    op.drop_column("seniors", "family_contact_1_phone")
    op.drop_column("seniors", "family_contact_1_name")
