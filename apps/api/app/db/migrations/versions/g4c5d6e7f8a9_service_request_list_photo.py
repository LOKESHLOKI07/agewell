"""senior shopping list / prescription photo on service requests

Revision ID: g4c5d6e7f8a9
Revises: f3b4c5d6e7f8
Create Date: 2026-10-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "g4c5d6e7f8a9"
down_revision: Union[str, None] = "f3b4c5d6e7f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("service_requests", sa.Column("list_photo", sa.Text(), nullable=True))
    op.alter_column(
        "service_requests",
        "notes",
        existing_type=sa.String(),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "service_requests",
        "notes",
        existing_type=sa.Text(),
        type_=sa.String(),
        existing_nullable=True,
    )
    op.drop_column("service_requests", "list_photo")
