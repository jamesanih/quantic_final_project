"""
API test fixtures.

All tests use:
  - InMemoryUserRepository   — no real PostgreSQL needed
  - fakeredis FakeRedis      — no real Redis needed
  - httpx AsyncClient        — drives the FastAPI app in-process
"""
from __future__ import annotations

import uuid

import fakeredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_auth_service, get_token_service
from app.application.services.auth_service import AuthService
from app.config import get_settings
from app.domain.user.aggregate import User
from app.domain.user.repository import UserRepository
from app.domain.user.value_objects import Email
from app.infrastructure.security.token_service import TokenService
from app.main import app


# ---------------------------------------------------------------------------
# In-memory UserRepository (no DB)
# ---------------------------------------------------------------------------

class InMemoryUserRepository(UserRepository):
    def __init__(self) -> None:
        self._store: dict[uuid.UUID, User] = {}

    async def add(self, user: User) -> None:
        self._store[user.id] = user

    async def get_by_id(self, id: uuid.UUID) -> User | None:
        return self._store.get(id)

    async def get_by_email(self, email: Email) -> User | None:
        return next(
            (u for u in self._store.values() if u.email == email), None
        )

    async def update(self, user: User) -> None:
        self._store[user.id] = user

    async def email_exists(self, email: Email) -> bool:
        return any(u.email == email for u in self._store.values())


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def fake_redis():
    return fakeredis.FakeAsyncRedis(decode_responses=True)


@pytest.fixture
def token_service(fake_redis) -> TokenService:
    s = get_settings()
    return TokenService(
        secret=s.JWT_SECRET,
        algorithm=s.JWT_ALGORITHM,
        access_expire_minutes=s.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_expire_days=s.REFRESH_TOKEN_EXPIRE_DAYS,
        redis=fake_redis,
    )


@pytest.fixture
def user_repo() -> InMemoryUserRepository:
    return InMemoryUserRepository()


@pytest.fixture
def auth_service(user_repo, token_service) -> AuthService:
    return AuthService(user_repo=user_repo, token_service=token_service)


@pytest_asyncio.fixture
async def client(auth_service, token_service) -> AsyncClient:
    """
    AsyncClient with overridden dependencies.
    Each test gets a fresh in-memory state.
    """
    app.dependency_overrides[get_auth_service] = lambda: auth_service
    app.dependency_overrides[get_token_service] = lambda: token_service
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helper — register + login in one call
# ---------------------------------------------------------------------------

async def register_and_login(client: AsyncClient, email="test@example.com", password="StrongP@ss1", role="CANDIDATE"):
    await client.post("/api/auth/register", json={
        "email": email, "password": password, "full_name": "Test User", "role": role
    })
    resp = await client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()
