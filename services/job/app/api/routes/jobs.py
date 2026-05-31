from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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

@router.post("/upload-description")
async def upload_job_description(file: UploadFile = File(...)):
    """Accepts a job description file (PDF, TXT, etc.), extracts text, and parses it via the matching LLM service."""
    # 1. Read file content
    content_bytes = await file.read()
    filename = file.filename or ""
    
    # 2. Extract text from the bytes
    text = ""
    if filename.lower().endswith(".pdf"):
        try:
            import pypdf
            import io
            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
        except Exception as e:
            # Fallback if pypdf is not installed or errors
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"pypdf extraction failed, falling back: {e}")
            text = content_bytes.decode("utf-8", errors="ignore")
    elif filename.lower().endswith(".docx") or filename.lower().endswith(".doc"):
        try:
            import docx
            import io
            doc = docx.Document(io.BytesIO(content_bytes))
            text = "\n".join([para.text for para in doc.paragraphs])
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"docx extraction failed, falling back: {e}")
            text = content_bytes.decode("utf-8", errors="ignore")
    else:
        # Default decode as plain text
        text = content_bytes.decode("utf-8", errors="ignore")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the file.")
        
    # 3. Call matching service to parse it via DeepSeek
    import urllib.request
    import json
    try:
        payload = {"text": text}
        # In Docker network, matching service is at http://matching:8000
        req = urllib.request.Request(
            "http://matching:8000/api/matching/parse-job",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as f:
            resp_data = json.loads(f.read().decode())
            return resp_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse job description using AI: {e}")
