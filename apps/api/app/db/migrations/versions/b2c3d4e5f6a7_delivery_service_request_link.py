"""link staff deliveries to service requests

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "staff_deliveries",
        sa.Column("service_request_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_staff_deliveries_service_request_id",
        "staff_deliveries",
        "service_requests",
        ["service_request_id"],
        ["id"],
    )
    op.create_index(
        "ix_staff_deliveries_service_request_id",
        "staff_deliveries",
        ["service_request_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_staff_deliveries_service_request_id", table_name="staff_deliveries")
    op.drop_constraint("fk_staff_deliveries_service_request_id", "staff_deliveries", type_="foreignkey")
    op.drop_column("staff_deliveries", "service_request_id")
