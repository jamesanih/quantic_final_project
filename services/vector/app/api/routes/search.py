"""Vector search API — semantic candidate search powered by DeepSeek."""

from __future__ import annotations

from typing import Optional
import urllib.request
import json
import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel

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
    # ── Finance ───────────────────────────────────────────────────────
    {
        "candidate_id": "cv-001",
        "name": "Thabo Molefe",
        "skills": ["Python", "Django", "PostgreSQL", "Docker", "AWS", "Financial Modelling"],
        "experience": "7 years backend development. Built trading systems at a Johannesburg bank. Strong in REST APIs and microservices.",
        "sector": "Finance",
        "location": "Johannesburg",
        "years": 7,
    },
    {
        "candidate_id": "cv-011",
        "name": "Zanele Khumalo",
        "skills": ["IFRS", "Financial Reporting", "Excel", "SAP", "Auditing", "Tax Compliance"],
        "experience": "9 years in corporate finance at Big 4 firm. Led annual audit teams, specialist in IFRS and tax compliance for JSE-listed companies.",
        "sector": "Finance",
        "location": "Johannesburg",
        "years": 9,
    },
    {
        "candidate_id": "cv-012",
        "name": "Brendan Ferreira",
        "skills": ["Risk Management", "Basel III", "Bloomberg Terminal", "VBA", "Fixed Income", "Derivatives"],
        "experience": "6 years as a risk analyst at a Cape Town investment bank. Expert in market risk, credit risk, and regulatory capital.",
        "sector": "Finance",
        "location": "Cape Town",
        "years": 6,
    },
    # ── IT / Software ─────────────────────────────────────────────────
    {
        "candidate_id": "cv-002",
        "name": "Priya Naidoo",
        "skills": ["Python", "TensorFlow", "PyTorch", "SQL", "AWS", "MLOps"],
        "experience": "5 years machine learning engineering. Deployed ML models at scale for a Durban logistics company. Kaggle competition winner.",
        "sector": "IT",
        "location": "Durban",
        "years": 5,
    },
    {
        "candidate_id": "cv-003",
        "name": "Sipho Dlamini",
        "skills": ["JavaScript", "React", "Node.js", "MongoDB", "TypeScript", "GraphQL"],
        "experience": "4 years full-stack development. Built SaaS products for Cape Town startups. Strong UI/UX sensibility.",
        "sector": "IT",
        "location": "Cape Town",
        "years": 4,
    },
    {
        "candidate_id": "cv-013",
        "name": "Aisha Patel",
        "skills": ["FastAPI", "Kubernetes", "CI/CD", "Terraform", "Azure", "Microservices"],
        "experience": "8 years DevOps and backend engineering. Managed cloud infrastructure for 50+ microservices in a Durban fintech.",
        "sector": "IT",
        "location": "Durban",
        "years": 8,
    },
    # ── Engineering ───────────────────────────────────────────────────
    {
        "candidate_id": "cv-004",
        "name": "Lebogang Sithole",
        "skills": ["AutoCAD", "SolidWorks", "Project Management", "Structural Analysis", "SANS Standards"],
        "experience": "10 years civil and structural engineering. Led infrastructure projects for Gauteng municipalities. PrEng registered.",
        "sector": "Engineering",
        "location": "Pretoria",
        "years": 10,
    },
    {
        "candidate_id": "cv-014",
        "name": "Ruan van der Merwe",
        "skills": ["Electrical Design", "PLC Programming", "SCADA", "HV Systems", "IEC Standards", "AutoCAD Electrical"],
        "experience": "7 years electrical engineering in the mining and energy sectors. Designed HV substations and automated control systems.",
        "sector": "Engineering",
        "location": "Johannesburg",
        "years": 7,
    },
    {
        "candidate_id": "cv-015",
        "name": "Fatima Essop",
        "skills": ["Chemical Engineering", "Process Optimisation", "Six Sigma", "Hazard Analysis", "SAP PM"],
        "experience": "5 years process engineering at a Sasol refinery. Specialised in plant optimisation, safety audits, and yield improvement.",
        "sector": "Engineering",
        "location": "Secunda",
        "years": 5,
    },
    # ── Medical / Healthcare ──────────────────────────────────────────
    {
        "candidate_id": "cv-005",
        "name": "Dr. Nomsa Dube",
        "skills": ["Clinical Research", "GCP", "CTMS", "Pharmacovigilance", "Protocol Development"],
        "experience": "8 years clinical research physician. Ran Phase II-III trials for leading SA biotech firms. HPCSA registered.",
        "sector": "Medical",
        "location": "Cape Town",
        "years": 8,
    },
    {
        "candidate_id": "cv-016",
        "name": "Gareth Hendricks",
        "skills": ["Theatre Nursing", "ICU Care", "Patient Assessment", "ACLS", "Wound Management"],
        "experience": "6 years as a registered nurse specialising in trauma and theatre at Groote Schuur Hospital. SANC registered.",
        "sector": "Medical",
        "location": "Cape Town",
        "years": 6,
    },
    {
        "candidate_id": "cv-017",
        "name": "Yvonne Masondo",
        "skills": ["Health Informatics", "EMR Systems", "HL7 FHIR", "SQL", "Data Analytics", "NHIA Compliance"],
        "experience": "5 years healthcare IT consultant. Implemented nationwide EMR rollouts for Department of Health. Expert in NHIA digital health.",
        "sector": "Medical",
        "location": "Pretoria",
        "years": 5,
    },
    # ── Mining ────────────────────────────────────────────────────────
    {
        "candidate_id": "cv-006",
        "name": "Kobus Pretorius",
        "skills": ["Mine Planning", "Surpac", "Ventilation Engineering", "Rock Mechanics", "MHSA Compliance"],
        "experience": "12 years underground mining at Gold Fields. Mine overseer certificate. Expert in deep-level gold mining operations.",
        "sector": "Mining",
        "location": "Carletonville",
        "years": 12,
    },
    {
        "candidate_id": "cv-018",
        "name": "Lindiwe Mahlangu",
        "skills": ["Metallurgy", "Mineral Processing", "Comminution", "Flotation", "Assaying", "Lean Manufacturing"],
        "experience": "6 years metallurgical engineer at a platinum concentrator in Rustenburg. Improved plant recovery by 8%.",
        "sector": "Mining",
        "location": "Rustenburg",
        "years": 6,
    },
    # ── Supply Chain ──────────────────────────────────────────────────
    {
        "candidate_id": "cv-007",
        "name": "Yusuf Cassim",
        "skills": ["SAP SCM", "Demand Planning", "Inventory Optimisation", "Warehouse Management", "APICS CPIM"],
        "experience": "9 years supply chain management in FMCG. Reduced logistics costs by 18% at a Johannesburg distributor through network optimisation.",
        "sector": "Supply Chain",
        "location": "Johannesburg",
        "years": 9,
    },
    {
        "candidate_id": "cv-019",
        "name": "Cherise du Plessis",
        "skills": ["Procurement", "Contract Management", "Supplier Development", "PFMA Compliance", "Oracle Procurement"],
        "experience": "7 years public sector procurement specialist. Managed R500M+ vendor contracts at a state entity in Pretoria.",
        "sector": "Supply Chain",
        "location": "Pretoria",
        "years": 7,
    },
    # ── Trade & Technical / Hospitality ──────────────────────────────
    {
        "candidate_id": "cv-008",
        "name": "Marcus Botha",
        "skills": ["Electrical Wiring", "PLC Maintenance", "Fault Finding", "Health & Safety", "SANS 10142"],
        "experience": "8 years electrician and instrumentation technician in industrial plants. Master Electrician licensed.",
        "sector": "Trade & Technical",
        "location": "East London",
        "years": 8,
    },
    {
        "candidate_id": "cv-009",
        "name": "Tendai Moyo",
        "skills": ["Hotel Management", "Revenue Optimisation", "Front Office", "F&B Management", "Opera PMS"],
        "experience": "10 years hospitality management. General Manager at 5-star Sandton hotel. Expert in revenue management and guest experience.",
        "sector": "Hospitality",
        "location": "Johannesburg",
        "years": 10,
    },
    {
        "candidate_id": "cv-020",
        "name": "Greta Swanepoel",
        "skills": ["Event Management", "Banqueting", "Budget Control", "Supplier Negotiation", "Food Safety"],
        "experience": "6 years events and banqueting coordinator at a Cape Town convention centre. Managed 200+ corporate events annually.",
        "sector": "Hospitality",
        "location": "Cape Town",
        "years": 6,
    },
    # ── General / Multi-sector ────────────────────────────────────────
    {
        "candidate_id": "cv-010",
        "name": "Amahle Zulu",
        "skills": ["Project Management", "PMP", "Agile", "Stakeholder Management", "MS Project", "Risk Management"],
        "experience": "11 years senior project manager across construction, IT, and energy sectors. Delivered 40+ projects on time and budget.",
        "sector": "Engineering",
        "location": "Durban",
        "years": 11,
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
    full_pool = list(DEMO_CANDIDATES)

    # ── Apply filters with graceful fallback ──────────────────────────
    # Each filter is applied only if it would not wipe the pool to empty.
    # This ensures the UI always shows results regardless of filter strictness.
    pool = full_pool

    if body.sector:
        filtered = [c for c in pool if c["sector"].lower() == body.sector.lower()]
        # Fallback: if no exact match, try partial (e.g. "Trade" in "Trade & Technical")
        if not filtered:
            filtered = [c for c in pool if body.sector.lower() in c["sector"].lower()]
        pool = filtered if filtered else pool  # never wipe to zero

    if body.location:
        filtered = [c for c in pool if body.location.lower() in c["location"].lower()]
        pool = filtered if filtered else pool  # never wipe to zero

    if body.min_experience:
        filtered = [c for c in pool if c["years"] >= body.min_experience]
        pool = filtered if filtered else pool  # never wipe to zero

    # ── Resolve the final query context ───────────────────────────────
    search_query = body.query or ""
    if body.job_id:
        job_context = fetch_job_context(body.job_id)
        if job_context:
            search_query = f"{job_context} {search_query}".strip()

    # ── No query at all → return full pool sorted by years desc ───────
    if not search_query:
        sorted_pool = sorted(pool, key=lambda c: c["years"], reverse=True)
        page_slice = sorted_pool[body.page : body.page + body.limit]
        candidates = [
            SearchResult(
                candidate_id=c["candidate_id"],
                name=c["name"],
                score=round(70 + min(c["years"], 15) * 2, 1),  # experience-weighted score
                matched_skills=c["skills"],
                missing_skills=[],
                rationale=f"{c['name']} has {c['years']} years of experience in {c['sector']}. {c['experience']}"
            ) for c in page_slice
        ]
        return SearchResponse(candidates=candidates, total_count=len(pool))

    # ── LLM semantic ranking ───────────────────────────────────────────
    # We ask for a bit more than the current page to ensure we have enough for the UI
    # but since the pool is small (demo), we can just ask the LLM to rank the entire pool
    llm_limit = max(len(pool), 50)
    
    try:
        result = await llm.semantic_search(
            query=search_query,
            candidates=pool,
            limit=llm_limit,
        )
        candidates_raw = result.get("candidates", [])
        
        # ── Fallback if LLM returns nothing ───────────────────────────
        # If LLM returned no candidates but we have a pool, don't show an empty page.
        # This fulfills the "always find candidates" requirement.
        if not candidates_raw and pool:
            logger.warning("LLM returned no candidates, falling back to experience-based ranking")
            sorted_pool = sorted(pool, key=lambda c: c["years"], reverse=True)
            candidates = [
                SearchResult(
                    candidate_id=c["candidate_id"],
                    name=c["name"],
                    score=round(60 + min(c["years"], 10) * 2, 1), # lower baseline for fallback
                    matched_skills=c["skills"][:3],
                    missing_skills=[],
                    rationale=f"Found via talent discovery fallback. {c['name']} has {c['years']} years of experience in {c['sector']}."
                ) for c in sorted_pool
            ]
            total = len(candidates)
        else:
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
            # Use the actual number of ranked results as the total for pagination
            total = len(candidates)
    except Exception as e:
        logger.error(f"LLM semantic search failed, falling back to pool: {e}")
        # Graceful fallback: return pool ranked by experience
        sorted_pool = sorted(pool, key=lambda c: c["years"], reverse=True)
        candidates = [
            SearchResult(
                candidate_id=c["candidate_id"],
                name=c["name"],
                score=round(70 + min(c["years"], 15) * 2, 1),
                matched_skills=c["skills"],
                missing_skills=[],
                rationale=f"{c['name']} has {c['years']} years of experience. {c['experience']}"
            ) for c in sorted_pool
        ]
        total = len(pool)

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
