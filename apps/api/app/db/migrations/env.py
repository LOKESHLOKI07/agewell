import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context
from app.db.base import Base

import app.modules.users.models
import app.modules.seniors.models
import app.modules.families.models
import app.modules.access.models
import app.modules.care.models
import app.modules.services.models
import app.modules.visits.models
import app.modules.healthcare.models
import app.modules.appointments.models
import app.modules.memberships.models
import app.modules.addons.models
import app.modules.orders.models
import app.modules.payments.models
import app.modules.emergency.models
import app.modules.tracking.models
import app.modules.notifications.models
import app.modules.community.models
import app.modules.documents.models
import app.modules.audit.models
import app.modules.catalog.models

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
