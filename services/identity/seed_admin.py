import asyncio
import logging
import sys
import os

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.path.join(os.getcwd(), "services/identity"))

from app.application.services.auth_service import AuthService
from app.infrastructure.database.engine import AsyncSessionLocal
from app.infrastructure.database.user_repository import PostgresUserRepository
from app.domain.user.value_objects import Role, Email

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_admin():
    async with AsyncSessionLocal() as session:
        user_repo = PostgresUserRepository(session)
        # TokenService needs a redis client, but we don't need it just to register
        # since register only uses the repo.
        auth_service = AuthService(user_repo, None) 

        admin_email = "admin@tumaini.ai"
        admin_password = "AdminPassword123!"
        admin_name = "System Administrator"

        try:
            # Check if admin already exists
            existing_user = await user_repo.get_by_email(Email(admin_email))
            if existing_user:
                logger.info("Admin user already exists.")
                return

            logger.info("Creating admin user...")
            await auth_service.register(
                email=admin_email,
                plain_password=admin_password,
                full_name=admin_name,
                role=Role.ADMIN
            )
            await session.commit()
            logger.info("Admin user created successfully!")
            logger.info(f"Email: {admin_email}")
            logger.info(f"Password: {admin_password}")

        except Exception as e:
            logger.error(f"Failed to seed admin user: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(seed_admin())
