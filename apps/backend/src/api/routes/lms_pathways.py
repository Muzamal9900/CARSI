"""
CARSI LMS Learning Pathways Routes

GET  /api/lms/pathways                     — list published pathways (public)
GET  /api/lms/pathways/{slug}              — pathway detail with courses (public)
POST /api/lms/admin/pathways               — create pathway (admin)
PATCH /api/lms/admin/pathways/{slug}       — update pathway (admin)
POST /api/lms/admin/pathways/{slug}/courses — add course to pathway (admin)
DELETE /api/lms/admin/pathways/{slug}/courses/{course_id} — remove course (admin)

GET  /api/lms/admin/categories             — list all categories (admin)
POST /api/lms/admin/categories             — create category (admin)
PATCH /api/lms/admin/categories/{slug}     — update category (admin)
DELETE /api/lms/admin/categories/{slug}    — delete category (admin)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps_lms import get_current_lms_user, require_role
from src.api.schemas.lms_pathways import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    PathwayCourseAdd,
    PathwayCourseOut,
    PathwayCreate,
    PathwayDetailOut,
    PathwayListOut,
    PathwayOut,
    PathwayUpdate,
    PrerequisiteAdd,
    PrerequisiteOut,
)
from src.config.database import get_async_db
from src.db.lms_models import (
    LMSCategory,
    LMSCourse,
    LMSCoursePrerequisite,
    LMSLearningPathway,
    LMSLearningPathwayCourse,
    LMSUser,
)

router = APIRouter(tags=["lms-pathways"])


# ===========================================================================
# Public Pathway Endpoints
# ===========================================================================


@router.get("/api/lms/pathways", response_model=PathwayListOut)
async def list_pathways(
    db: AsyncSession = Depends(get_async_db),
) -> PathwayListOut:
    """List all published learning pathways (public)."""
    count_stmt = select(func.count()).select_from(LMSLearningPathway).where(LMSLearningPathway.is_published.is_(True))
    total = (await db.execute(count_stmt)).scalar() or 0

    items_stmt = (
        select(LMSLearningPathway)
        .where(LMSLearningPathway.is_published.is_(True))
        .order_by(LMSLearningPathway.order_index, LMSLearningPathway.title)
    )
    pathways = (await db.execute(items_stmt)).scalars().all()

    return PathwayListOut(
        items=[PathwayOut.model_validate(p) for p in pathways],
        total=total,
    )


@router.get("/api/lms/pathways/{slug}", response_model=PathwayDetailOut)
async def get_pathway(
    slug: str,
    db: AsyncSession = Depends(get_async_db),
) -> PathwayDetailOut:
    """Get a published pathway with its ordered course list (public)."""
    stmt = (
        select(LMSLearningPathway)
        .where(LMSLearningPathway.slug == slug, LMSLearningPathway.is_published.is_(True))
        .options(
            selectinload(LMSLearningPathway.pathway_courses).selectinload(LMSLearningPathwayCourse.course)
        )
    )
    result = await db.execute(stmt)
    pathway = result.scalar_one_or_none()

    if not pathway:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pathway not found")

    courses = [
        PathwayCourseOut(
            course_id=pc.course_id,
            order_index=pc.order_index,
            is_required=pc.is_required,
            course_slug=pc.course.slug if pc.course else None,
            course_title=pc.course.title if pc.course else None,
            iicrc_discipline=pc.course.iicrc_discipline if pc.course else None,
            cec_hours=pc.course.cec_hours if pc.course else None,
        )
        for pc in sorted(pathway.pathway_courses, key=lambda x: x.order_index)
    ]

    return PathwayDetailOut(**PathwayOut.model_validate(pathway).model_dump(), courses=courses)


# ===========================================================================
# Admin Pathway Endpoints
# ===========================================================================


@router.post("/api/lms/admin/pathways", response_model=PathwayOut, status_code=status.HTTP_201_CREATED)
async def create_pathway(
    data: PathwayCreate,
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> PathwayOut:
    """Create a new learning pathway (admin only)."""
    existing = await db.execute(select(LMSLearningPathway).where(LMSLearningPathway.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A pathway with this slug already exists")

    pathway = LMSLearningPathway(**data.model_dump())
    db.add(pathway)
    await db.commit()
    await db.refresh(pathway)
    return PathwayOut.model_validate(pathway)


@router.patch("/api/lms/admin/pathways/{slug}", response_model=PathwayOut)
async def update_pathway(
    slug: str,
    data: PathwayUpdate,
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> PathwayOut:
    """Update a learning pathway (admin only)."""
    result = await db.execute(select(LMSLearningPathway).where(LMSLearningPathway.slug == slug))
    pathway = result.scalar_one_or_none()
    if not pathway:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pathway not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(pathway, field, value)

    await db.commit()
    await db.refresh(pathway)
    return PathwayOut.model_validate(pathway)


@router.post("/api/lms/admin/pathways/{slug}/courses", response_model=PathwayCourseOut, status_code=status.HTTP_201_CREATED)
async def add_course_to_pathway(
    slug: str,
    data: PathwayCourseAdd,
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> PathwayCourseOut:
    """Add a course to a learning pathway (admin only)."""
    pathway_result = await db.execute(select(LMSLearningPathway).where(LMSLearningPathway.slug == slug))
    pathway = pathway_result.scalar_one_or_none()
    if not pathway:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pathway not found")

    course_result = await db.execute(select(LMSCourse).where(LMSCourse.id == data.course_id))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Check not already in pathway
    existing = await db.execute(
        select(LMSLearningPathwayCourse).where(
            LMSLearningPathwayCourse.pathway_id == pathway.id,
            LMSLearningPathwayCourse.course_id == data.course_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Course already in this pathway")

    pc = LMSLearningPathwayCourse(
        pathway_id=pathway.id,
        course_id=data.course_id,
        order_index=data.order_index,
        is_required=data.is_required,
    )
    db.add(pc)
    await db.commit()

    return PathwayCourseOut(
        course_id=pc.course_id,
        order_index=pc.order_index,
        is_required=pc.is_required,
        course_slug=course.slug,
        course_title=course.title,
        iicrc_discipline=course.iicrc_discipline,
        cec_hours=course.cec_hours,
    )


@router.delete("/api/lms/admin/pathways/{slug}/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_course_from_pathway(
    slug: str,
    course_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> None:
    """Remove a course from a learning pathway (admin only)."""
    pathway_result = await db.execute(select(LMSLearningPathway).where(LMSLearningPathway.slug == slug))
    pathway = pathway_result.scalar_one_or_none()
    if not pathway:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pathway not found")

    result = await db.execute(
        select(LMSLearningPathwayCourse).where(
            LMSLearningPathwayCourse.pathway_id == pathway.id,
            LMSLearningPathwayCourse.course_id == course_id,
        )
    )
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not in this pathway")

    await db.delete(pc)
    await db.commit()


# ===========================================================================
# Course Prerequisites
# ===========================================================================


@router.post("/api/lms/courses/{slug}/prerequisites", response_model=PrerequisiteOut, status_code=status.HTTP_201_CREATED)
async def add_prerequisite(
    slug: str,
    data: PrerequisiteAdd,
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> PrerequisiteOut:
    """Add a prerequisite to a course (admin only)."""
    course_result = await db.execute(select(LMSCourse).where(LMSCourse.slug == slug))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    prereq_result = await db.execute(select(LMSCourse).where(LMSCourse.id == data.prerequisite_course_id))
    prereq = prereq_result.scalar_one_or_none()
    if not prereq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prerequisite course not found")

    if course.id == data.prerequisite_course_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A course cannot be its own prerequisite")

    existing = await db.execute(
        select(LMSCoursePrerequisite).where(
            LMSCoursePrerequisite.course_id == course.id,
            LMSCoursePrerequisite.prerequisite_course_id == data.prerequisite_course_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Prerequisite already set")

    pr = LMSCoursePrerequisite(
        course_id=course.id,
        prerequisite_course_id=data.prerequisite_course_id,
        is_strict=data.is_strict,
    )
    db.add(pr)
    await db.commit()

    return PrerequisiteOut(
        prerequisite_course_id=pr.prerequisite_course_id,
        is_strict=pr.is_strict,
        prerequisite_slug=prereq.slug,
        prerequisite_title=prereq.title,
    )


# ===========================================================================
# Category Endpoints (Admin)
# ===========================================================================


@router.get("/api/lms/admin/categories", response_model=list[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> list[CategoryOut]:
    """List all categories (admin only)."""
    result = await db.execute(select(LMSCategory).order_by(LMSCategory.order_index, LMSCategory.name))
    return [CategoryOut.model_validate(c) for c in result.scalars().all()]


@router.post("/api/lms/admin/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> CategoryOut:
    """Create a new category (admin only)."""
    existing = await db.execute(select(LMSCategory).where(LMSCategory.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category with this slug already exists")

    category = LMSCategory(**data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return CategoryOut.model_validate(category)


@router.patch("/api/lms/admin/categories/{slug}", response_model=CategoryOut)
async def update_category(
    slug: str,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> CategoryOut:
    """Update a category (admin only)."""
    result = await db.execute(select(LMSCategory).where(LMSCategory.slug == slug))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)
    return CategoryOut.model_validate(category)


@router.delete("/api/lms/admin/categories/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    slug: str,
    db: AsyncSession = Depends(get_async_db),
    _: LMSUser = Depends(require_role(["admin"])),
) -> None:
    """Delete a category (admin only). Courses using it will have category_id set to NULL."""
    result = await db.execute(select(LMSCategory).where(LMSCategory.slug == slug))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    await db.delete(category)
    await db.commit()
