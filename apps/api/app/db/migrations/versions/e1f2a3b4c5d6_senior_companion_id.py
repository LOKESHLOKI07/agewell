"""standing companion assignment on seniors

Revision ID: e1f2a3b4c5d6
Revises: d8e9f0a1b2c3
Create Date: 2026-09-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "d8e9f0a1b2c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seniors", sa.Column("companion_id", sa.UUID(), nullable=True))
    op.create_index("ix_seniors_companion_id", "seniors", ["companion_id"], unique=False)
    op.create_foreign_key(
        "fk_seniors_companion_id",
        "seniors",
        "care_managers",
        ["companion_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_seniors_companion_id", "seniors", type_="foreignkey")
    op.drop_index("ix_seniors_companion_id", table_name="seniors")
    op.drop_column("seniors", "companion_id")
