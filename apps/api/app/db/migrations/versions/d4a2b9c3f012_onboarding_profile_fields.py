"""onboarding profile fields for seniors and families

Revision ID: d4a2b9c3f012
Revises: c3f1a8b2e901
Create Date: 2026-08-26
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4a2b9c3f012"
down_revision: Union[str, None] = "c3f1a8b2e901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seniors", sa.Column("preferred_language", sa.String(), nullable=True))
    op.add_column("family_members", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("family_members", sa.Column("address", sa.String(), nullable=True))
    op.add_column("family_members", sa.Column("preferred_language", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("family_members", "preferred_language")
    op.drop_column("family_members", "address")
    op.drop_column("family_members", "date_of_birth")
    op.drop_column("seniors", "preferred_language")
