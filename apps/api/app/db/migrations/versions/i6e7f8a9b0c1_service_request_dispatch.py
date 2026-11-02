"""dispatcher/executor on service requests for SC handoff

Revision ID: i6e7f8a9b0c1
Revises: h5d6e7f8a9b0
Create Date: 2026-10-30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "i6e7f8a9b0c1"
down_revision: Union[str, None] = "h5d6e7f8a9b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "service_requests",
        sa.Column("dispatcher_id", sa.UUID(), sa.ForeignKey("care_managers.id"), nullable=True),
    )
    op.add_column(
        "service_requests",
        sa.Column("executor_id", sa.UUID(), sa.ForeignKey("care_managers.id"), nullable=True),
    )
    op.create_index("ix_service_requests_dispatcher_id", "service_requests", ["dispatcher_id"])
    op.create_index("ix_service_requests_executor_id", "service_requests", ["executor_id"])


def downgrade() -> None:
    op.drop_index("ix_service_requests_executor_id", table_name="service_requests")
    op.drop_index("ix_service_requests_dispatcher_id", table_name="service_requests")
    op.drop_column("service_requests", "executor_id")
    op.drop_column("service_requests", "dispatcher_id")
