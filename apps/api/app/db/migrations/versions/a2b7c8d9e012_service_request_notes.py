"""add notes to service_requests

Revision ID: a2b7c8d9e012
Revises: f1a9c2e4b056
Create Date: 2026-08-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a2b7c8d9e012"
down_revision: Union[str, None] = "f1a9c2e4b056"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("service_requests", sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("service_requests", "notes")
