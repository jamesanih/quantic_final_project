from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.infrastructure.database.engine import get_db
from app.infrastructure.database.models import ShortlistModel, ShortlistCandidateModel
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import io

# reportlab for PDF generation
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/shortlists", tags=["shortlists"])

class ShortlistCandidateResponse(BaseModel):
    candidate_id: str
    name: str
    score: float
    matched_skills: List[str]
    added_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ShortlistResponse(BaseModel):
    id: uuid.UUID
    name: str
    job_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    candidates: List[ShortlistCandidateResponse] = []

    class Config:
        from_attributes = True

class CreateShortlistRequest(BaseModel):
    name: str
    job_id: Optional[uuid.UUID] = None

class AddCandidateRequest(BaseModel):
    candidate_id: str
    candidate_name: str
    score: float
    matched_skills: List[str] = []
    notes: Optional[str] = None

@router.get("", response_model=List[ShortlistResponse])
async def get_shortlists(db: AsyncSession = Depends(get_db)):
    stmt = select(ShortlistModel).options(selectinload(ShortlistModel.candidates)).order_by(ShortlistModel.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=ShortlistResponse, status_code=status.HTTP_201_CREATED)
async def create_shortlist(body: CreateShortlistRequest, db: AsyncSession = Depends(get_db)):
    shortlist = ShortlistModel(
        name=body.name,
        job_id=body.job_id
    )
    db.add(shortlist)
    await db.commit()
    await db.refresh(shortlist)
    stmt = select(ShortlistModel).where(ShortlistModel.id == shortlist.id).options(selectinload(ShortlistModel.candidates))
    result = await db.execute(stmt)
    return result.scalar_one()

@router.post("/{id}/add", status_code=status.HTTP_204_NO_CONTENT)
async def add_candidate_to_shortlist(id: uuid.UUID, body: AddCandidateRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(ShortlistModel).where(ShortlistModel.id == id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Shortlist not found")
    
    candidate = ShortlistCandidateModel(
        shortlist_id=id,
        candidate_id=body.candidate_id,
        name=body.candidate_name,
        score=body.score,
        matched_skills=body.matched_skills,
        notes=body.notes
    )
    db.add(candidate)
    await db.commit()
    return

@router.delete("/{id}/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_candidate(id: uuid.UUID, candidate_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ShortlistCandidateModel).where(
        ShortlistCandidateModel.shortlist_id == id,
        ShortlistCandidateModel.candidate_id == candidate_id
    )
    result = await db.execute(stmt)
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found in shortlist")
    
    await db.delete(candidate)
    await db.commit()

@router.get("/{id}/export")
async def export_shortlist(
    id: uuid.UUID,
    format: str = Query("pdf", pattern="^(pdf|excel)$"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ShortlistModel)
        .options(selectinload(ShortlistModel.candidates))
        .where(ShortlistModel.id == id)
    )
    result = await db.execute(stmt)
    sl = result.scalar_one_or_none()
    if not sl:
        raise HTTPException(status_code=404, detail="Shortlist not found")

    if format == "excel":
        content = f"Name,Score,Skills,Added At,Notes\n"
        for c in sl.candidates:
            skills = ", ".join(c.matched_skills)
            content += f"\"{c.name}\",{c.score:.0f}%,\"{skills}\",\"{c.added_at.strftime('%Y-%m-%d')}\",\"{c.notes or ''}\"\n"
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=shortlist-{id}.csv"},
        )
    else:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=20,
            textColor=colors.HexColor('#FF6B35')
        )
        
        elements = []
        elements.append(Paragraph(f"Shortlist: {sl.name}", title_style))
        elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Table data
        data = [['Candidate Name', 'Match Score', 'Matched Skills']]
        for c in sl.candidates:
            data.append([
                c.name,
                f"{c.score:.0f}%",
                ", ".join(c.matched_skills[:5]) + ("..." if len(c.matched_skills) > 5 else "")
            ])
            
        t = Table(data, colWidths=[150, 80, 280])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B2A4A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        elements.append(t)
        doc.build(elements)
        
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=shortlist-{id}.pdf"},
        )

@router.get("/{id}", response_model=ShortlistResponse)
async def get_shortlist(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(ShortlistModel).where(ShortlistModel.id == id).options(selectinload(ShortlistModel.candidates))
    result = await db.execute(stmt)
    shortlist = result.scalar_one_or_none()
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    return shortlist

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shortlist(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(ShortlistModel).where(ShortlistModel.id == id)
    result = await db.execute(stmt)
    shortlist = result.scalar_one_or_none()
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    await db.delete(shortlist)
    await db.commit()
    return None
