import datetime
import io
import json
import logging
import urllib.request
from typing import List

import docx
import pdfplumber
from fastapi import File, UploadFile
from openai import AsyncOpenAI
from pydantic import BaseModel

from tumaini_shared.api.app import create_app
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

app = create_app(
    title="CV Service",
    description=(
        "Handles CV file upload (PDF, DOCX, TXT), "
        "text extraction, and AI-powered candidate information parsing using DeepSeek."
    ),
)

# ── LLM Client ─────────────────────────────────────────────────────────
llm_client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL,
)

# ── Models ─────────────────────────────────────────────────────────────
class WorkExperience(BaseModel):
    title: str
    company: str
    duration: str
    description: str

class Education(BaseModel):
    degree: str
    institution: str
    year: str

class CVExtractedData(BaseModel):
    name: str
    email: str
    phone: str
    location: str
    skills: List[str]
    work_experiences: List[WorkExperience]
    education: List[Education]

# ── In-memory store ────────────────────────────────────────────────────
_cvs: list[dict] = []

@app.get("/health", tags=["ops"])
async def health() -> dict:
    return {"status": "ok", "service": "cv"}

@app.get("/api/cvs/me", tags=["cvs"])
async def get_my_cvs() -> list:
    return _cvs

@app.get("/api/cvs/{cv_id}", tags=["cvs"])
async def get_cv(cv_id: str) -> dict:
    for cv in _cvs:
        if cv["id"] == cv_id:
            return cv
    return {"id": cv_id, "file_name": "unknown", "status": "NOT_FOUND"}

async def save_to_vector_db(cv_data: dict):
    """Send the extracted CV data to the vector service for semantic indexing."""
    try:
        extracted = cv_data["extracted_data"]
        experience_text = ""
        if extracted.get("work_experiences"):
            exp = extracted["work_experiences"][0]
            experience_text = f"{exp.get('title')} at {exp.get('company')}: {exp.get('description')}"

        payload = {
            "candidate_id": cv_data["candidate_id"],
            "name": extracted.get("name", "Unknown"),
            "skills": extracted.get("skills", []),
            "experience": experience_text or "No experience details.",
            "sector": "General",
            "location": extracted.get("location", "Unknown"),
            "years": 5,
        }
        
        req = urllib.request.Request(
            settings.VECTOR_SERVICE_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        # Using a simple synchronous call for now as per existing pattern, 
        # but in a real app this should be async httpx
        with urllib.request.urlopen(req):
            pass
        logger.info(f"Indexed {cv_data['candidate_id']} in vector DB")
    except Exception as e:
        logger.warning(f"Vector index skipped: {e}")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([p.text for p in doc.paragraphs])

CV_PARSING_PROMPT = """You are an expert AI recruitment assistant.
Extract structured details from the following CV/Resume text.

Return ONLY a JSON object with this exact structure:
{
  "name": "<Full Name>",
  "email": "<Email Address>",
  "phone": "<Phone Number>",
  "location": "<City, Country>",
  "skills": ["<skill1>", "<skill2>", ...],
  "work_experiences": [
    {
      "title": "<Job Title>",
      "company": "<Company Name>",
      "duration": "<Dates>",
      "description": "<Brief summary of responsibilities>"
    }
  ],
  "education": [
    {
      "degree": "<Degree Name>",
      "institution": "<University/School>",
      "year": "<Graduation Year>"
    }
  ]
}"""

async def ai_extract_entities(text: str) -> dict:
    """Use DeepSeek to extract structured entities from CV text."""
    try:
        response = await llm_client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": CV_PARSING_PROMPT},
                {"role": "user", "content": f"Extract details from this CV:\n\n{text}"},
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"AI Extraction failed: {e}")
        # Fallback to empty structure
        return {
            "name": "Unknown",
            "email": "unknown@example.com",
            "phone": "N/A",
            "location": "Unknown",
            "skills": [],
            "work_experiences": [],
            "education": []
        }

async def _build_cv(cv_id: str, file_name: str, file_bytes: bytes) -> dict:
    """Build a processed CV record with AI-extracted data."""
    text = ""
    if file_name.lower().endswith(".pdf"):
        try:
            text = extract_text_from_pdf(file_bytes)
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            text = file_bytes.decode("utf-8", errors="ignore")
    elif file_name.lower().endswith(".docx"):
        try:
            text = extract_text_from_docx(file_bytes)
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            text = file_bytes.decode("utf-8", errors="ignore")
    else:
        text = file_bytes.decode("utf-8", errors="ignore")

    if not text.strip():
        extracted = {
            "name": file_name.split(".")[0],
            "email": "unknown@example.com",
            "phone": "N/A",
            "location": "Unknown",
            "skills": [],
            "work_experiences": [],
            "education": []
        }
    else:
        extracted = await ai_extract_entities(text)

    cv = {
        "id": cv_id,
        "candidate_id": "cand-" + cv_id,
        "file_name": file_name,
        "status": "PROCESSED",
        "uploaded_at": datetime.datetime.now().isoformat(),
        "extracted_data": extracted,
    }
    
    await save_to_vector_db(cv)
    _cvs.append(cv)
    return cv

@app.post("/api/cvs/upload", tags=["cvs"])
async def upload_cv(file: UploadFile = File(...)) -> dict:
    file_bytes = await file.read()
    cv_id = f"cv-{len(_cvs)+1:03d}"
    return await _build_cv(cv_id, file.filename or "upload.pdf", file_bytes)

@app.post("/api/cvs/bulk-upload", tags=["cvs"])
async def bulk_upload_cvs(files: List[UploadFile] = File(...)) -> list:
    result = []
    for f in files:
        file_bytes = await f.read()
        cv_id = f"cv-{len(_cvs)+1:03d}"
        result.append(await _build_cv(cv_id, f.filename or "upload.pdf", file_bytes))
    return result

@app.delete("/api/cvs/{cv_id}", tags=["cvs"])
async def delete_cv(cv_id: str) -> dict:
    global _cvs
    cv_to_delete = next((cv for cv in _cvs if cv["id"] == cv_id), None)
    if not cv_to_delete:
        return {"status": "error", "message": "CV not found"}
        
    try:
        candidate_id = cv_to_delete["candidate_id"]
        req = urllib.request.Request(
            f"http://vector:8000/api/vectors/{candidate_id}",
            method="DELETE"
        )
        with urllib.request.urlopen(req):
            pass
        logger.info(f"Deleted vector index for candidate {candidate_id}")
    except Exception as e:
        logger.warning(f"Vector delete failed: {e}")
        
    _cvs[:] = [cv for cv in _cvs if cv["id"] != cv_id]
    return {"status": "success", "id": cv_id}
