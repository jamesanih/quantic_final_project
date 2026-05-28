from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.infrastructure.database.engine import get_db
from app.infrastructure.database.models import JobModel
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/jobs", tags=["jobs"])

class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str
    required_skills: List[str] = []
    location: str
    sector: str
    status: str = "OPEN"
    client_name: Optional[str] = None

class JobResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    requirements: str
    required_skills: List[str]
    location: str
    sector: str
    status: str
    client_name: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JobsListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int

@router.get("", response_model=JobsListResponse)
async def get_jobs(
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = None,
    sector: Optional[str] = None,
    status: Optional[str] = "OPEN",
    limit: int = 12,
    page: int = 1
):
    offset = (page - 1) * limit
    
    stmt = select(JobModel)
    
    if status:
        stmt = stmt.where(JobModel.status == status)
    if sector:
        stmt = stmt.where(JobModel.sector == sector)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(or_(
            JobModel.title.ilike(search_filter),
            JobModel.description.ilike(search_filter),
            JobModel.location.ilike(search_filter)
        ))
    
    # Count total matching records
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0
    
    # Get paginated results
    stmt = stmt.order_by(JobModel.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    
    return {
        "jobs": list(jobs),
        "total": total
    }

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(body: JobCreate, db: AsyncSession = Depends(get_db)):
    job = JobModel(
        title=body.title,
        description=body.description,
        requirements=body.requirements,
        required_skills=body.required_skills,
        location=body.location,
        sector=body.sector,
        status=body.status,
        client_name=body.client_name
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(JobModel).where(JobModel.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID, 
    body: JobCreate, 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(JobModel).where(JobModel.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.title = body.title
    job.description = body.description
    job.requirements = body.requirements
    job.required_skills = body.required_skills
    job.location = body.location
    job.sector = body.sector
    job.status = body.status
    job.client_name = body.client_name
    
    await db.commit()
    await db.refresh(job)
    return job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    # 1. Nullify job_id on shortlists to avoid foreign key violations
    from sqlalchemy import update
    from app.infrastructure.database.models import ShortlistModel
    await db.execute(
        update(ShortlistModel)
        .where(ShortlistModel.job_id == job_id)
        .values(job_id=None)
    )
    
    # 2. Get and delete the job
    stmt = select(JobModel).where(JobModel.id == job_id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
    return None
