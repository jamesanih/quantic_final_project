from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from tumaini_shared.api.app import create_app

from app.api.routes import auth, password_reset
from app.infrastructure.cache.redis_client import close_redis, get_redis

logger = logging.getLogger(__name__)


async def _run_migrations():
    """Run alembic migrations on startup."""
    try:
        from alembic.config import Config
        from alembic import command
        import os
        alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations applied successfully.")
    except Exception as e:
        logger.error(f"Migration failed: {e}")


async def _seed_admin():
    """Create the default admin user if it doesn't exist."""
    try:
        from app.infrastructure.database.engine import AsyncSessionLocal
        from app.infrastructure.database.user_repository import PostgresUserRepository
        from app.application.services.auth_service import AuthService
        from app.domain.user.value_objects import Role, Email

        async with AsyncSessionLocal() as session:
            user_repo = PostgresUserRepository(session)
            auth_service = AuthService(user_repo, None)
            existing = await user_repo.get_by_email(Email("admin@tumaini.ai"))
            if existing:
                logger.info("Admin user already exists — skipping seed.")
                return
            await auth_service.register(
                email="admin@tumaini.ai",
                plain_password="AdminPassword123!",
                full_name="System Administrator",
                role=Role.ADMIN,
            )
            await session.commit()
            logger.info("Admin user seeded: admin@tumaini.ai")
    except Exception as e:
        logger.error(f"Admin seed failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run migrations then seed on every startup
    await _run_migrations()
    await _seed_admin()
    # Warm up Redis connection on startup
    await get_redis()
    yield
    await close_redis()


app = create_app(
    title="Identity Service",
    description=(
        "Handles user registration, login, JWT access/refresh tokens, "
        "role-based access control (RBAC), and password reset."
    ),
)

# Override lifespan after create_app so we can manage Redis lifecycle
app.router.lifespan_context = lifespan

# ---------------------------------------------------------------------------
# Rate limiting (slowapi)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/api")
app.include_router(password_reset.router, prefix="/api")


@app.get("/health", tags=["ops"])
async def health() -> dict:
    return {"status": "ok", "service": "identity"}
