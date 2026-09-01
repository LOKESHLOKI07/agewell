"""add service slug for membership catalogue

Revision ID: f1a9c2e4b056
Revises: e8c1d4a7b023
Create Date: 2026-08-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a9c2e4b056"
down_revision: Union[str, None] = "e8c1d4a7b023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("services", sa.Column("slug", sa.String(), nullable=True))
    op.create_index("ix_services_slug", "services", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_services_slug", table_name="services")
    op.drop_column("services", "slug")
