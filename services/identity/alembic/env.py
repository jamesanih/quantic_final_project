import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Import models so Alembic detects them for autogenerate
from app.infrastructure.database.engine import Base
import app.infrastructure.database.models  # noqa: F401

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url():
    return os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url"))


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    url = get_url()
    connectable = create_async_engine(url)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No running loop, safe to use asyncio.run
        asyncio.run(run_migrations_online())
    else:
        # Already in a loop. We need to run the coroutine.
        # However, command.upgrade is sync and won't await this.
        # This is why we get the warning. 
        # A common hack is to use a separate thread or just let the 
        # startup task handle it.
        if loop.is_running():
            # In FastAPI lifespan, the loop is running.
            # We can use nest_asyncio or just accept that we shouldn't 
            # be calling sync alembic commands from async lifespan.
            import threading
            def run_in_thread():
                asyncio.run(run_migrations_online())
            t = threading.Thread(target=run_in_thread)
            t.start()
            t.join()
        else:
            asyncio.run(run_migrations_online())
