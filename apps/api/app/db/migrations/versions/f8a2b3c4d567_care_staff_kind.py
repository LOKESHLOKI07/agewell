"""care staff kind

Revision ID: f8a2b3c4d567
Revises: e7f0a1b2c345
Create Date: 2026-09-01
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f8a2b3c4d567"
down_revision: Union[str, None] = "e7f0a1b2c345"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "care_managers",
        sa.Column("staff_kind", sa.String(), nullable=False, server_default="CARE_MANAGER"),
    )


def downgrade() -> None:
    op.drop_column("care_managers", "staff_kind")
