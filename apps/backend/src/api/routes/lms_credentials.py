"""
CARSI LMS Credential Routes

GET /api/lms/credentials/{credential_id}  — public credential verification
  credential_id is the enrollment UUID; no auth required (public verification page)
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config.database import get_async_db
from src.db.lms_models import LMSCourse, LMSEnrollment, LMSUser

router = APIRouter(prefix="/api/lms/credentials", tags=["lms-credentials"])


class CredentialOut(BaseModel):
    credential_id: str
    valid: bool
    status: str
    student_name: str
    course_title: str
    iicrc_discipline: str
    cec_hours: float
    issued_date: str
    issuing_organisation: str
    verification_url: str
    cppp40421_unit_code: str | None = None


@router.get("/{credential_id}", response_model=CredentialOut)
async def get_credential(
    credential_id: str,
    db: AsyncSession = Depends(get_async_db),
) -> CredentialOut:
    """Return a verifiable credential derived from an enrollment record."""
    try:
        uid = UUID(credential_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")

    result = await db.execute(
        select(LMSEnrollment)
        .where(LMSEnrollment.id == uid)
        .options(
            selectinload(LMSEnrollment.student),
            selectinload(LMSEnrollment.course),
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")

    course: LMSCourse = enrollment.course
    student: LMSUser = enrollment.student

    is_valid = enrollment.status in ("active", "completed")
    issued_ts: datetime = enrollment.completed_at or enrollment.enrolled_at
    issued_date = issued_ts.strftime("%d %B %Y").lstrip("0") if issued_ts else "—"

    return CredentialOut(
        credential_id=credential_id,
        valid=is_valid,
        status=enrollment.status,
        student_name=student.full_name if student else "Unknown",
        course_title=course.title if course else "Unknown",
        iicrc_discipline=course.iicrc_discipline or "—" if course else "—",
        cec_hours=float(course.cec_hours) if course and course.cec_hours else 0.0,
        issued_date=issued_date,
        issuing_organisation="CARSI — Certified Applied Restoration & Skilling Institute",
        verification_url=f"https://carsi.com.au/credentials/{credential_id}",
        cppp40421_unit_code=course.cppp40421_unit_code if course else None,
    )
