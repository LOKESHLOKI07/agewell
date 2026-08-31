"""senior profile photo

Revision ID: e8c1d4a7b023
Revises: d4a2b9c3f012
Create Date: 2026-08-27
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8c1d4a7b023"
down_revision: Union[str, None] = "d4a2b9c3f012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seniors", sa.Column("photo", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("seniors", "photo")
