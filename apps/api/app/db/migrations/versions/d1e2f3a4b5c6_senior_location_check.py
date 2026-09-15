"""senior location check coords and query

Revision ID: d1e2f3a4b5c6
Revises: c7d4e8f1a290
Create Date: 2026-09-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "c7d4e8f1a290"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("seniors", sa.Column("location_lat", sa.Float(), nullable=True))
    op.add_column("seniors", sa.Column("location_lng", sa.Float(), nullable=True))
    op.add_column("seniors", sa.Column("location_query", sa.String(), nullable=True))
    op.add_column("seniors", sa.Column("location_source", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("seniors", "location_source")
    op.drop_column("seniors", "location_query")
    op.drop_column("seniors", "location_lng")
    op.drop_column("seniors", "location_lat")
