"""Vector search API — semantic candidate search powered by DeepSeek."""

from __future__ import annotations

from typing import Optional, List
import urllib.request
import json
import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.infrastructure.llm import get_llm_provider, LLMProvider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vectors", tags=["search"])

JOB_SERVICE_URL = "http://job:8000/api/jobs"

# ── Request / Response models ──────────────────────────────────────────

class SearchRequest(BaseModel):
    query: Optional[str] = None
    job_id: Optional[str] = None
    limit: int = 10
    page: int = 0
    sector: Optional[str] = None
    location: Optional[str] = None
    min_experience: Optional[int] = None


class SearchResult(BaseModel):
    candidate_id: str
    name: str
    score: float
    matched_skills: list[str]
    missing_skills: list[str]
    rationale: str


class SearchResponse(BaseModel):
    candidates: list[SearchResult]
    total_count: int
    next_page_token: Optional[str] = None

class AddCandidateRequest(BaseModel):
    candidate_id: str
    name: str
    skills: list[str]
    experience: str
    sector: str
    location: str
    years: int

# ── Demo candidate pool ────────────────────────────────────────────────
# This pool will persist as long as the container is running
DEMO_CANDIDATES = [
    {
        "candidate_id": "cv-001",
        "name": "Thabo Molefe",
        "skills": ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
        "experience": "7 years backend development. Built trading systems at a Johannesburg bank. Strong in REST APIs and microservices.",
        "sector": "Finance",
        "location": "Johannesburg",
        "years": 7,
    },
    {
        "candidate_id": "cv-002",
        "name": "Priya Naidoo",
        "skills": ["Python", "TensorFlow", "PyTorch", "SQL", "AWS"],
        "experience": "5 years machine learning engineering. Deployed ML models at scale for a Durban logistics company. Kaggle competition winner.",
        "sector": "IT",
        "location": "Durban",
        "years": 5,
    },
    {
        "candidate_id": "cv-003",
        "name": "Sipho Dlamini",
        "skills": ["JavaScript", "React", "Node.js", "MongoDB", "TypeScript"],
        "experience": "4 years full-stack development. Built SaaS products for Cape Town startups. Strong UI/UX sensibility.",
        "sector": "IT",
        "location": "Cape Town",
        "years": 4,
    },
]

def fetch_job_context(job_id: str) -> str:
    """Fetch job title and requirements from the Job service."""
    try:
        url = f"{JOB_SERVICE_URL}/{job_id}"
        with urllib.request.urlopen(url) as response:
            job = json.loads(response.read().decode())
            return f"{job.get('title', '')} {job.get('requirements', '')} {job.get('description', '')}"
    except Exception as e:
        logger.error(f"Failed to fetch job context for {job_id}: {e}")
        return ""

# ── Routes ─────────────────────────────────────────────────────────────

@router.post("/search", response_model=SearchResponse)
async def search(
    body: SearchRequest,
    llm: LLMProvider = Depends(get_llm_provider),
) -> SearchResponse:
    """Semantic candidate search using DeepSeek LLM."""
    pool = DEMO_CANDIDATES
    if body.sector:
        pool = [c for c in pool if c["sector"].lower() == body.sector.lower()]
    if body.location:
        pool = [c for c in pool if body.location.lower() in c["location"].lower()]
    if body.min_experience:
        pool = [c for c in pool if c["years"] >= body.min_experience]

    if not pool:
        return SearchResponse(candidates=[], total_count=0)

    # Resolve the final query context
    search_query = body.query or ""
    if body.job_id:
        job_context = fetch_job_context(body.job_id)
        if job_context:
            # Combine job context with manual query for refinement
            search_query = f"{job_context} {search_query}".strip()

    if not search_query:
        # Fallback to returning the pool if no query is possible
        candidates = [
            SearchResult(
                candidate_id=c["candidate_id"],
                name=c["name"],
                score=100.0,
                matched_skills=c["skills"],
                missing_skills=[],
                rationale="Direct match in the database."
            ) for c in pool[body.page : body.page + body.limit]
        ]
        return SearchResponse(candidates=candidates, total_count=len(pool))

    # Request a larger scored pool from the LLM so we have enough items to paginate
    llm_limit = max(body.page + body.limit, 50)
    result = await llm.semantic_search(
        query=search_query,
        candidates=pool,
        limit=llm_limit,
    )

    candidates_raw = result.get("candidates", [])
    # If the LLM scored all of them, the total count is the size of the filtered pool
    total = result.get("total_count", len(pool))

    candidates = [
        SearchResult(
            candidate_id=c.get("candidate_id", ""),
            name=c.get("name", ""),
            score=c.get("score", 0.0),
            matched_skills=c.get("matched_skills", []),
            missing_skills=c.get("missing_skills", []),
            rationale=c.get("rationale", ""),
        )
        for c in candidates_raw
    ]

    # Slice the scored candidates according to the pagination offset (body.page)
    candidates_sliced = candidates[body.page : body.page + body.limit]

    return SearchResponse(candidates=candidates_sliced, total_count=total)

@router.post("/add", status_code=201)
async def add_candidate(body: AddCandidateRequest):
    """Simulate saving a CV to the vector DB by adding to the in-memory pool."""
    DEMO_CANDIDATES.append(body.dict())
    return {"status": "success", "candidate_id": body.candidate_id}

@router.delete("/{candidate_id}", status_code=200)
async def delete_candidate(candidate_id: str):
    """Simulate deleting a candidate from the vector DB."""
    global DEMO_CANDIDATES
    DEMO_CANDIDATES[:] = [c for c in DEMO_CANDIDATES if c["candidate_id"] != candidate_id]
    return {"status": "success"}
