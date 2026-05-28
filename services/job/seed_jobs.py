import asyncio
import logging
import sys
import os

sys.path.append(os.path.join(os.getcwd(), "services/job"))

from app.infrastructure.database.engine import AsyncSessionLocal, engine, Base
from app.infrastructure.database.models import JobModel
from sqlalchemy import select, func

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEMO_JOBS = [
    {
        "title": "Senior Full Stack Developer",
        "description": "We are looking for a Senior Full Stack Developer to join our growing engineering team. You will be responsible for designing, building and maintaining scalable web applications used by thousands of users daily.",
        "requirements": "8+ years of experience in full stack development. Strong experience with React, Node.js and cloud platforms.",
        "required_skills": ["React", "Node.js", "AWS", "TypeScript", "PostgreSQL"],
        "location": "Cape Town",
        "sector": "Technology",
        "status": "OPEN",
        "client_name": "TechFlow Solutions",
    },
    {
        "title": "Agile Project Manager",
        "description": "Seeking an experienced Project Manager to lead complex telecommunications infrastructure projects from inception to delivery.",
        "requirements": "10+ years experience in project management. PMP or PRINCE2 certified. Strong Agile and Scrum background.",
        "required_skills": ["Project Management", "Agile", "Scrum", "PMP", "Stakeholder Management"],
        "location": "Johannesburg",
        "sector": "Telecommunications",
        "status": "OPEN",
        "client_name": "MTN South Africa",
    },
    {
        "title": "Data Engineer",
        "description": "We need a skilled Data Engineer to build and maintain our data pipelines, data warehouse, and analytics infrastructure.",
        "requirements": "5+ years experience in data engineering. Proficient in Python, Spark, and SQL.",
        "required_skills": ["Python", "Apache Spark", "Kafka", "SQL", "dbt", "Airflow"],
        "location": "Sandton, Johannesburg",
        "sector": "Financial Services",
        "status": "OPEN",
        "client_name": "Standard Bank",
    },
    {
        "title": "DevOps / Cloud Engineer",
        "description": "Join our platform engineering team to build, automate and improve our cloud infrastructure. You will own CI/CD pipelines, container orchestration and cloud cost optimisation.",
        "requirements": "4+ years in DevOps or cloud engineering. Strong Kubernetes and Terraform skills.",
        "required_skills": ["Kubernetes", "Terraform", "Docker", "AWS", "CI/CD", "Linux"],
        "location": "Remote (South Africa)",
        "sector": "Technology",
        "status": "OPEN",
        "client_name": "Tumaini AI",
    },
    {
        "title": "Finance Manager",
        "description": "We are looking for a Finance Manager to lead our financial planning, analysis and reporting functions.",
        "requirements": "CA(SA) qualified. 6+ years post-articles experience. Strong IFRS knowledge.",
        "required_skills": ["CA(SA)", "IFRS", "Financial Reporting", "Excel", "SAP", "Budgeting"],
        "location": "Johannesburg",
        "sector": "Mining",
        "status": "OPEN",
        "client_name": "Anglo American",
    },
    {
        "title": "Machine Learning Engineer",
        "description": "Build and deploy production ML models for our recommendation and fraud detection systems.",
        "requirements": "3+ years in ML engineering. Strong Python and deep learning skills. Experience with MLOps.",
        "required_skills": ["Python", "PyTorch", "MLflow", "FastAPI", "SQL", "Docker"],
        "location": "Cape Town",
        "sector": "Fintech",
        "status": "OPEN",
        "client_name": "Jumo",
    },
]


async def seed_jobs():
    async with AsyncSessionLocal() as session:
        # Ensure tables exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Check if jobs already exist (idempotent)
        result = await session.execute(select(func.count()).select_from(JobModel))
        count = result.scalar()
        if count > 0:
            logger.info(f"Jobs already seeded ({count} exist) — skipping.")
            return

        for job_data in DEMO_JOBS:
            session.add(JobModel(**job_data))

        await session.commit()
        logger.info(f"Job seeding completed: {len(DEMO_JOBS)} demo jobs created.")


if __name__ == "__main__":
    asyncio.run(seed_jobs())
