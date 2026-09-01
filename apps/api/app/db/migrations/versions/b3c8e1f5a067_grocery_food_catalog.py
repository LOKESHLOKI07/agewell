"""grocery and food delivery catalogs

Revision ID: b3c8e1f5a067
Revises: a2b7c8d9e012
Create Date: 2026-08-31
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b3c8e1f5a067"
down_revision: Union[str, None] = "a2b7c8d9e012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "grocery_categories",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "grocery_products",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("category_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("unit", sa.String(), nullable=False, server_default=""),
        sa.Column("price_label", sa.String(), nullable=False, server_default=""),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["category_id"], ["grocery_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_grocery_products_category_id", "grocery_products", ["category_id"])

    op.create_table(
        "food_cuisines",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "food_menu_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("cuisine_id", sa.UUID(), nullable=False),
        sa.Column("meal", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("price_label", sa.String(), nullable=False, server_default=""),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["cuisine_id"], ["food_cuisines.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_food_menu_items_cuisine_id", "food_menu_items", ["cuisine_id"])


def downgrade() -> None:
    op.drop_index("ix_food_menu_items_cuisine_id", table_name="food_menu_items")
    op.drop_table("food_menu_items")
    op.drop_table("food_cuisines")
    op.drop_index("ix_grocery_products_category_id", table_name="grocery_products")
    op.drop_table("grocery_products")
    op.drop_table("grocery_categories")
