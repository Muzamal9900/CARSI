"""Pydantic schemas for Learning Pathways and Category Taxonomy."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

IICRC_DISCIPLINES = {"WRT", "CRT", "OCT", "ASD", "CCT"}


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------


class CategoryCreate(BaseModel):
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    name: str = Field(..., min_length=2, max_length=255)
    parent_id: UUID | None = None
    order_index: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    parent_id: UUID | None = None
    order_index: int | None = None


class CategoryOut(BaseModel):
    id: UUID
    slug: str
    name: str
    parent_id: UUID | None
    order_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Learning Pathways
# ---------------------------------------------------------------------------


class PathwayCourseOut(BaseModel):
    """A course entry within a learning pathway."""

    course_id: UUID
    order_index: int
    is_required: bool
    # Flattened course fields for convenience
    course_slug: str | None = None
    course_title: str | None = None
    iicrc_discipline: str | None = None
    cec_hours: Decimal | None = None

    model_config = {"from_attributes": True}


class PathwayCreate(BaseModel):
    slug: str = Field(..., min_length=2, max_length=255, pattern=r"^[a-z0-9-]+$")
    title: str = Field(..., min_length=2, max_length=500)
    description: str | None = None
    iicrc_discipline: str | None = Field(None, max_length=10)
    target_certification: str | None = Field(None, max_length=100)
    estimated_hours: Decimal | None = Field(None, ge=0)
    order_index: int = 0


class PathwayUpdate(BaseModel):
    title: str | None = Field(None, min_length=2, max_length=500)
    description: str | None = None
    iicrc_discipline: str | None = Field(None, max_length=10)
    target_certification: str | None = Field(None, max_length=100)
    estimated_hours: Decimal | None = Field(None, ge=0)
    is_published: bool | None = None
    order_index: int | None = None


class PathwayOut(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str | None
    iicrc_discipline: str | None
    target_certification: str | None
    estimated_hours: Decimal | None
    is_published: bool
    order_index: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PathwayDetailOut(PathwayOut):
    """Pathway with its ordered course list."""

    courses: list[PathwayCourseOut] = []


class PathwayListOut(BaseModel):
    items: list[PathwayOut]
    total: int


# ---------------------------------------------------------------------------
# Pathway course membership
# ---------------------------------------------------------------------------


class PathwayCourseAdd(BaseModel):
    course_id: UUID
    order_index: int
    is_required: bool = True


# ---------------------------------------------------------------------------
# Course Prerequisites
# ---------------------------------------------------------------------------


class PrerequisiteAdd(BaseModel):
    prerequisite_course_id: UUID
    is_strict: bool = False


class PrerequisiteOut(BaseModel):
    prerequisite_course_id: UUID
    is_strict: bool
    prerequisite_slug: str | None = None
    prerequisite_title: str | None = None

    model_config = {"from_attributes": True}
