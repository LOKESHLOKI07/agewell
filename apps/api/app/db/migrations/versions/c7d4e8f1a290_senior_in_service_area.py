"""senior in_service_area flag

Revision ID: c7d4e8f1a290
Revises: b2c3d4e5f6a7
Create Date: 2026-09-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7d4e8f1a290"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seniors", sa.Column("in_service_area", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("seniors", "in_service_area")
