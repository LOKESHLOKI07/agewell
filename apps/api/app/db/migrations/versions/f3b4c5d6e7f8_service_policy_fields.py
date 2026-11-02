"""service slug and proof photos for policy rules

Revision ID: f3b4c5d6e7f8
Revises: f2a3b4c5d6e7
Create Date: 2026-10-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3b4c5d6e7f8"
down_revision: Union[str, None] = "f2a3b4c5d6e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("visits", sa.Column("service_slug", sa.String(), nullable=True))
    op.add_column("visit_reports", sa.Column("proof_photo", sa.Text(), nullable=True))
    op.add_column("staff_deliveries", sa.Column("service_slug", sa.String(), nullable=True))
    op.add_column("staff_deliveries", sa.Column("proof_photo", sa.Text(), nullable=True))
    op.add_column("emergency_cases", sa.Column("proof_photo", sa.Text(), nullable=True))
    op.add_column("service_requests", sa.Column("proof_photo", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("service_requests", "proof_photo")
    op.drop_column("emergency_cases", "proof_photo")
    op.drop_column("staff_deliveries", "proof_photo")
    op.drop_column("staff_deliveries", "service_slug")
    op.drop_column("visit_reports", "proof_photo")
    op.drop_column("visits", "service_slug")
