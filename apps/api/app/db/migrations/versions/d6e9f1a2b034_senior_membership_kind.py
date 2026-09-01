"""senior membership kind (single / couple)

Revision ID: d6e9f1a2b034
Revises: c5d8e2f4a091
Create Date: 2026-08-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d6e9f1a2b034"
down_revision: Union[str, None] = "c5d8e2f4a091"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seniors", sa.Column("membership_kind", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("seniors", "membership_kind")
