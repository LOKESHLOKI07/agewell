"""membership apply contacts

Revision ID: b4c5d6e7f890
Revises: a3b4c5d6e789
Create Date: 2026-10-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b4c5d6e7f890"
down_revision: Union[str, None] = "a3b4c5d6e789"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("membership_requests", sa.Column("emergency_contact_name", sa.String(), nullable=True))
    op.add_column("membership_requests", sa.Column("emergency_contact_phone", sa.String(), nullable=True))
    op.add_column("seniors", sa.Column("emergency_contact_name", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("seniors", "emergency_contact_name")
    op.drop_column("membership_requests", "emergency_contact_phone")
    op.drop_column("membership_requests", "emergency_contact_name")
