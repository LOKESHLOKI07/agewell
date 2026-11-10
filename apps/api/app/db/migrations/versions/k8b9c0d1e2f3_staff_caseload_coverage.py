"""primary assignee fields for temporary caseload coverage

Revision ID: k8b9c0d1e2f3
Revises: j7f8a9b0c1d2
Create Date: 2026-11-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k8b9c0d1e2f3"
down_revision: Union[str, None] = "j7f8a9b0c1d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seniors", sa.Column("care_manager_primary_id", sa.UUID(), nullable=True))
    op.add_column("seniors", sa.Column("companion_primary_id", sa.UUID(), nullable=True))
    op.create_index("ix_seniors_care_manager_primary_id", "seniors", ["care_manager_primary_id"], unique=False)
    op.create_index("ix_seniors_companion_primary_id", "seniors", ["companion_primary_id"], unique=False)
    op.create_foreign_key(
        "fk_seniors_care_manager_primary_id",
        "seniors",
        "care_managers",
        ["care_manager_primary_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_seniors_companion_primary_id",
        "seniors",
        "care_managers",
        ["companion_primary_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_seniors_companion_primary_id", "seniors", type_="foreignkey")
    op.drop_constraint("fk_seniors_care_manager_primary_id", "seniors", type_="foreignkey")
    op.drop_index("ix_seniors_companion_primary_id", table_name="seniors")
    op.drop_index("ix_seniors_care_manager_primary_id", table_name="seniors")
    op.drop_column("seniors", "companion_primary_id")
    op.drop_column("seniors", "care_manager_primary_id")
