"""Matching API — start scoring jobs and retrieve results."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.infrastructure.llm import get_llm_provider, LLMProvider

router = APIRouter(prefix="/matching", tags=["matching"])

# ── In-memory store for demo / early development ───────────────────────
_jobs: dict[str, dict] = {}          # job_id → job definition
_results: dict[str, list[dict]] = {}  # job_id → list of scored results


# ── Request / Response models ──────────────────────────────────────────

class MatchingStartRequest(BaseModel):
    """Matches the frontend's MatchingRequest shape."""
    job_id: str
    candidate_ids: Optional[list[str]] = None
    threshold: Optional[float] = None


class MatchingStartResponse(BaseModel):
    job_id: str
    status: str = "processing"


class CandidateResult(BaseModel):
    candidate_id: str
    name: str
    score: float
    rationale: str
    matched_skills: list[str]
    missing_skills: list[str]


# ── Routes ─────────────────────────────────────────────────────────────

@router.post("/start", response_model=MatchingStartResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_matching(
    body: MatchingStartRequest,
    llm: LLMProvider = Depends(get_llm_provider),
) -> MatchingStartResponse:
    """Start scoring candidates for a job using the LLM pipeline.

    In production this fetches job details from the Job service and candidate
    CVs from the Vector service. For now it uses demo data so the frontend
    can validate the integration.
    """
    job_id = body.job_id
    threshold = body.threshold if body.threshold is not None else 0.0

    # Demo job (in production: fetch from Job service via HTTP)
    demo_job = {
        "title": "Senior Python Developer",
        "description": (
            "We are looking for an experienced Python developer to build "
            "scalable microservices with FastAPI, manage PostgreSQL databases, "
            "and deploy with Docker on AWS."
        ),
        "requirements": "5+ years Python, FastAPI, PostgreSQL, Docker, AWS",
    }

    # Demo candidates (in production: fetch from Vector/CV service)
    demo_candidates = [
        {
            "candidate_id": f"{job_id}-c1",
            "name": "Alice Nkosi",
            "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
            "experience": "6 years backend engineering, built 3 microservice platforms at FinTech scale-up.",
        },
        {
            "candidate_id": f"{job_id}-c2",
            "name": "Bob Mthembu",
            "skills": ["Python", "Django", "MySQL", "Docker"],
            "experience": "4 years web development, 1 year DevOps at a logistics company.",
        },
        {
            "candidate_id": f"{job_id}-c3",
            "name": "Carol Van Wyk",
            "skills": ["Python", "FastAPI", "PostgreSQL", "AWS", "Terraform"],
            "experience": "8 years Python, currently lead platform engineer at a bank.",
        },
    ]

    _jobs[job_id] = {"title": demo_job["title"]}

    scored: list[dict] = []
    for candidate in demo_candidates:
        result = await llm.score_candidate(
            job_title=demo_job["title"],
            job_description=demo_job["description"],
            job_requirements=demo_job["requirements"],
            candidate_skills=candidate["skills"],
            candidate_experience=candidate["experience"],
        )
        scored.append({
            "candidate_id": candidate["candidate_id"],
            "name": candidate["name"],
            "score": result.get("score", 0.0),
            "rationale": result.get("rationale", ""),
            "matched_skills": result.get("matched_skills", []),
            "missing_skills": result.get("missing_skills", []),
        })

    # Filter by threshold if provided
    if threshold > 0:
        scored = [r for r in scored if r["score"] >= threshold * 100]

    # Sort by score descending
    scored.sort(key=lambda r: r["score"], reverse=True)
    _results[job_id] = scored

    return MatchingStartResponse(job_id=job_id, status="completed")


@router.get("/{job_id}/results", response_model=list[CandidateResult])
async def get_matching_results(job_id: str) -> list[CandidateResult]:
    """Retrieve scored results for a completed matching job.

    Returns a bare array to match the frontend's MatchingResult[] expectation.
    """
    if job_id not in _results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No results found for job {job_id}.",
        )
    return [CandidateResult(**r) for r in _results[job_id]]

PARSING_SYSTEM_PROMPT = """You are an expert AI recruitment assistant.
Extract structured details from the following Job Description text.

Return ONLY a JSON object with this exact structure:
{
  "title": "<Job Title>",
  "client_name": "<Company/Client Name or null>",
  "location": "<Location e.g. Cape Town, South Africa or null>",
  "sector": "<Industry Sector e.g. IT, Engineering, Finance, Medical, Mining, Supply Chain, Hospitality>",
  "salary_range": "<Salary range or null>",
  "description": "<Detailed job summary>",
  "requirements": "<Detailed job requirements>",
  "required_skills": ["<skill1>", "<skill2>", ...]
}"""

class ParseJobRequest(BaseModel):
    text: str

class ParsedJobResponse(BaseModel):
    title: str
    client_name: Optional[str] = None
    location: Optional[str] = None
    sector: Optional[str] = "IT"
    salary_range: Optional[str] = None
    description: str
    requirements: str
    required_skills: list[str] = []

@router.post("/parse-job", response_model=ParsedJobResponse)
async def parse_job_description(
    body: ParseJobRequest,
    llm: LLMProvider = Depends(get_llm_provider),
):
    """Use DeepSeek to parse a raw job description text into a structured mandate."""
    prompt = f"Extract structured job mandate details from the following text:\n\n{body.text}"
    try:
        response = await llm._primary_client.chat.completions.create(
            model=llm._primary_model,
            messages=[
                {"role": "system", "content": PARSING_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=1024,
        )
        content = response.choices[0].message.content or ""
        parsed = llm._parse_json_response(content)
        return ParsedJobResponse(
            title=parsed.get("title", "Job Position"),
            client_name=parsed.get("client_name"),
            location=parsed.get("location", "Remote"),
            sector=parsed.get("sector", "IT"),
            salary_range=parsed.get("salary_range"),
            description=parsed.get("description", ""),
            requirements=parsed.get("requirements", ""),
            required_skills=parsed.get("required_skills", []),
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to parse job description: {e}")
        return ParsedJobResponse(
            title="Extracted Job Mandate",
            description=body.text[:500],
            requirements="Please review manual entry.",
        )
