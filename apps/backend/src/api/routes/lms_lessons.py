"""LMS Lesson routes — Phase 10 (GP-106)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.api.deps_lms import get_current_lms_user
from src.api.schemas.lms_lessons import LessonOut
from src.config.database import get_async_db
from src.db.lms_models import LMSLesson, LMSUser

router = APIRouter(prefix="/api/lms/lessons", tags=["lms-lessons"])


@router.get("/{lesson_id}", response_model=LessonOut)
async def get_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: LMSUser = Depends(get_current_lms_user),
) -> LessonOut:
    """Return lesson detail for the lesson player."""
    result = await db.execute(
        select(LMSLesson)
        .options(joinedload(LMSLesson.module))
        .where(LMSLesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    return LessonOut(
        id=lesson.id,
        title=lesson.title,
        content_type=lesson.content_type,
        content_body=lesson.content_body,
        drive_file_id=lesson.drive_file_id,
        duration_minutes=lesson.duration_minutes,
        is_preview=lesson.is_preview,
        order_index=lesson.order_index,
        course_id=lesson.module.course_id,
    )
