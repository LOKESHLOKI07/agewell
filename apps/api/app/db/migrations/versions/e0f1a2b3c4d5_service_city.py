"""service city on users and seniors

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-10-28
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e0f1a2b3c4d5"
down_revision: Union[str, None] = "d9e0f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("service_city", sa.String(), nullable=True))
    op.create_index("ix_users_service_city", "users", ["service_city"])
    op.add_column("seniors", sa.Column("service_city", sa.String(), nullable=True))
    op.create_index("ix_seniors_service_city", "seniors", ["service_city"])

    op.execute(
        sa.text(
            """
            UPDATE seniors
            SET service_city = 'mumbai'
            WHERE service_city IS NULL
              AND (
                COALESCE(address, '') ILIKE '%kandivali%'
                OR COALESCE(address, '') ILIKE '%kandivli%'
                OR COALESCE(address, '') ILIKE '%borivali%'
                OR COALESCE(address, '') ILIKE '%borivli%'
                OR COALESCE(location_query, '') ILIKE '%kandivali%'
                OR COALESCE(location_query, '') ILIKE '%borivali%'
                OR COALESCE(location_query, '') ILIKE '%mumbai%'
              )
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE seniors
            SET service_city = 'chandrapur'
            WHERE service_city IS NULL
              AND (
                COALESCE(address, '') ILIKE '%warora%'
                OR COALESCE(address, '') ILIKE '%bhadravati%'
                OR COALESCE(address, '') ILIKE '%chandrapur%'
                OR COALESCE(address, '') ILIKE '%wani%'
                OR COALESCE(location_query, '') ILIKE '%warora%'
                OR COALESCE(location_query, '') ILIKE '%bhadravati%'
                OR COALESCE(location_query, '') ILIKE '%chandrapur%'
                OR COALESCE(location_query, '') ILIKE '%wani%'
              )
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE users
            SET service_city = seniors.service_city
            FROM seniors
            WHERE seniors.user_id = users.id
              AND users.service_city IS NULL
              AND seniors.service_city IS NOT NULL
            """
        )
    )


def downgrade() -> None:
    op.drop_index("ix_seniors_service_city", table_name="seniors")
    op.drop_column("seniors", "service_city")
    op.drop_index("ix_users_service_city", table_name="users")
    op.drop_column("users", "service_city")
