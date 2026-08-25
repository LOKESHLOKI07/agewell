"""Add care manager first and last name.

Revision ID: a1c4e7b2d890
Revises: 65b4d7d96f60
Create Date: 2026-08-20 13:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1c4e7b2d890"
down_revision: Union[str, None] = "65b4d7d96f60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("care_managers", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("care_managers", sa.Column("last_name", sa.String(), nullable=True))
    op.execute(
        sa.text(
            "UPDATE care_managers SET first_name = 'Rohit', last_name = 'Sharma' "
            "WHERE employee_id = 'CM01' AND first_name IS NULL"
        )
    )


def downgrade() -> None:
    op.drop_column("care_managers", "last_name")
    op.drop_column("care_managers", "first_name")
