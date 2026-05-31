from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from tumaini_shared.api.app import create_app

from app.api.routes import jobs, shortlists
from app.infrastructure.database.engine import engine, Base, AsyncSessionLocal
from app.infrastructure.database.models import JobModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEMO_JOBS = [
    {
        "title": "Senior Full Stack Developer",
        "description": "We are looking for a Senior Full Stack Developer to join our growing engineering team. You will be responsible for designing, building and maintaining scalable web applications used by thousands of users daily.",
        "requirements": "8+ years of experience in full stack development. Strong experience with React, Node.js and cloud platforms. Experience with microservices architecture.",
        "required_skills": ["React", "Node.js", "AWS", "TypeScript", "PostgreSQL"],
        "location": "Cape Town",
        "sector": "Technology",
        "status": "OPEN",
        "client_name": "TechFlow Solutions",
    },
    {
        "title": "Agile Project Manager",
        "description": "Seeking an experienced Project Manager to lead complex telecommunications infrastructure projects from inception to delivery. You will work closely with cross-functional teams and stakeholders.",
        "requirements": "10+ years experience in project management. PMP or PRINCE2 certified. Strong Agile and Scrum background.",
        "required_skills": ["Project Management", "Agile", "Scrum", "PMP", "Stakeholder Management"],
        "location": "Johannesburg",
        "sector": "Telecommunications",
        "status": "OPEN",
        "client_name": "MTN South Africa",
    },
    {
        "title": "Data Engineer",
        "description": "We need a skilled Data Engineer to build and maintain our data pipelines, data warehouse, and analytics infrastructure. You will collaborate with data scientists and business intelligence teams.",
        "requirements": "5+ years experience in data engineering. Proficient in Python, Spark, and SQL. Experience with cloud data platforms.",
        "required_skills": ["Python", "Apache Spark", "Kafka", "SQL", "dbt", "Airflow"],
        "location": "Sandton, Johannesburg",
        "sector": "Financial Services",
        "status": "OPEN",
        "client_name": "Standard Bank",
    },
    {
        "title": "DevOps / Cloud Engineer",
        "description": "Join our platform engineering team to build, automate and improve our cloud infrastructure. You will own CI/CD pipelines, container orchestration and cloud cost optimisation.",
        "requirements": "4+ years in DevOps or cloud engineering. Strong Kubernetes and Terraform skills. Experience with multi-cloud environments.",
        "required_skills": ["Kubernetes", "Terraform", "Docker", "AWS", "CI/CD", "Linux"],
        "location": "Remote (South Africa)",
        "sector": "Technology",
        "status": "OPEN",
        "client_name": "Tumaini AI",
    },
    {
        "title": "Finance Manager",
        "description": "We are looking for a Finance Manager to lead our financial planning, analysis and reporting functions. You will manage a team of accountants and work directly with the CFO.",
        "requirements": "CA(SA) qualified. 6+ years post-articles experience. Strong IFRS knowledge and advanced Excel skills.",
        "required_skills": ["CA(SA)", "IFRS", "Financial Reporting", "Excel", "SAP", "Budgeting"],
        "location": "Johannesburg",
        "sector": "Mining",
        "status": "OPEN",
        "client_name": "Anglo American",
    },
    {
        "title": "Machine Learning Engineer",
        "description": "Build and deploy production ML models for our recommendation and fraud detection systems. You will work at the intersection of research and engineering.",
        "requirements": "3+ years in ML engineering. Strong Python and deep learning skills. Experience with MLOps and model serving.",
        "required_skills": ["Python", "PyTorch", "MLflow", "FastAPI", "SQL", "Docker"],
        "location": "Cape Town",
        "sector": "Fintech",
        "status": "OPEN",
        "client_name": "Jumo",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create all tables on startup (idempotent)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Job service: database tables ready.")
    except Exception as e:
        logger.error(f"Job service: table creation failed: {e}")

    # Auto-seed demo jobs if the table is empty
    try:
        async with AsyncSessionLocal() as session:
            from sqlalchemy import select, func
            result = await session.execute(select(func.count()).select_from(JobModel))
            count = result.scalar()
            if count == 0:
                for job_data in DEMO_JOBS:
                    session.add(JobModel(**job_data))
                await session.commit()
                logger.info(f"Job service: seeded {len(DEMO_JOBS)} demo jobs.")
            else:
                logger.info(f"Job service: {count} jobs already exist, skipping seed.")
    except Exception as e:
        logger.error(f"Job service: job seeding failed: {e}")

    yield


app = create_app(
    title="Job Service",
    description=(
        "Manages job postings, candidate applications, shortlist creation, "
        "audit trails, and shortlist export to PDF and Excel."
    ),
)

# Register the lifespan context manager
app.router.lifespan_context = lifespan

app.include_router(jobs.router, prefix="/api")
app.include_router(shortlists.router, prefix="/api")


@app.get("/health", tags=["ops"])
async def health() -> dict:
    return {"status": "ok", "service": "job"}


@app.get("/api/applications", tags=["applications"])
async def get_applications() -> list:
    """Stub endpoint to prevent 404 in frontend dashboard."""
    return []
