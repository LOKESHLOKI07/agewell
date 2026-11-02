"""optional action_ref on notifications for deep links

Revision ID: h5d6e7f8a9b0
Revises: g4c5d6e7f8a9
Create Date: 2026-10-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h5d6e7f8a9b0"
down_revision: Union[str, None] = "g4c5d6e7f8a9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notifications", sa.Column("action_ref", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("notifications", "action_ref")
