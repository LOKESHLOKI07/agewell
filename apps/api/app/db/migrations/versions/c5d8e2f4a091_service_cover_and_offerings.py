"""service cover images and shared service offerings catalog

Revision ID: c5d8e2f4a091
Revises: b3c8e1f5a067
Create Date: 2026-08-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c5d8e2f4a091"
down_revision: Union[str, None] = "b3c8e1f5a067"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("services", sa.Column("cover_image", sa.Text(), nullable=True))
    op.create_table(
        "service_offerings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("service_slug", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False, server_default=""),
        sa.Column("badge", sa.String(), nullable=False, server_default=""),
        sa.Column("price_label", sa.String(), nullable=False, server_default=""),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column("meta_json", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_service_offerings_service_slug", "service_offerings", ["service_slug"])


def downgrade() -> None:
    op.drop_index("ix_service_offerings_service_slug", table_name="service_offerings")
    op.drop_table("service_offerings")
    op.drop_column("services", "cover_image")
