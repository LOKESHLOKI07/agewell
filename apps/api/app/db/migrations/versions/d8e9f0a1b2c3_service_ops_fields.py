"""service call hours / support phone + request created_at

Revision ID: d8e9f0a1b2c3
Revises: c6d7e8f9a0b1
Create Date: 2026-09-15
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d8e9f0a1b2c3"
down_revision: Union[str, None] = "c6d7e8f9a0b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("services", sa.Column("call_hours_text", sa.String(), nullable=True))
    op.add_column("services", sa.Column("support_phone", sa.String(), nullable=True))
    op.add_column(
        "service_requests",
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("service_requests", "created_at")
    op.drop_column("services", "support_phone")
    op.drop_column("services", "call_hours_text")
