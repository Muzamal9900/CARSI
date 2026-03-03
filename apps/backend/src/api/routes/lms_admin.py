"""LMS Admin routes — Phase 13 (GP-109)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps_lms import get_current_lms_user
from src.config.database import get_async_db
from src.db.lms_models import LMSCourse, LMSEnrollment, LMSRole, LMSUser, LMSUserRole

router = APIRouter(prefix="/api/lms/admin", tags=["lms-admin"])


def _require_admin(user: LMSUser) -> None:
    roles = {ur.role.name for ur in user.user_roles}
    if "admin" not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


# ---------------------------------------------------------------------------
# Users list
# ---------------------------------------------------------------------------


class AdminUserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    roles: list[str]

    model_config = {"from_attributes": True}


@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    db: AsyncSession = Depends(get_async_db),
    current_user: LMSUser = Depends(get_current_lms_user),
) -> list[AdminUserOut]:
    """Return all users with their roles (admin only)."""
    _require_admin(current_user)

    result = await db.execute(
        select(LMSUser).options(selectinload(LMSUser.user_roles).selectinload(LMSUserRole.role))
    )
    users = result.scalars().all()

    return [
        AdminUserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            is_active=u.is_active or False,
            roles=[ur.role.name for ur in u.user_roles],
        )
        for u in users
    ]


# ---------------------------------------------------------------------------
# Role update
# ---------------------------------------------------------------------------


class RoleUpdate(BaseModel):
    role: str


@router.patch("/users/{user_id}/role", response_model=AdminUserOut)
async def update_user_role(
    user_id: UUID,
    body: RoleUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: LMSUser = Depends(get_current_lms_user),
) -> AdminUserOut:
    """Set a user's primary role (replaces existing roles)."""
    _require_admin(current_user)

    result = await db.execute(
        select(LMSUser)
        .options(selectinload(LMSUser.user_roles).selectinload(LMSUserRole.role))
        .where(LMSUser.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Find the target role record
    role_result = await db.execute(select(LMSRole).where(LMSRole.name == body.role))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown role: {body.role}")

    # Remove existing roles and add new one
    for ur in list(user.user_roles):
        await db.delete(ur)
    db.add(LMSUserRole(user_id=user.id, role_id=role.id))
    await db.commit()

    return AdminUserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active or False,
        roles=[body.role],
    )


# ---------------------------------------------------------------------------
# Platform metrics
# ---------------------------------------------------------------------------


class MetricsOut(BaseModel):
    total_users: int
    total_courses: int
    total_enrollments: int


@router.get("/metrics", response_model=MetricsOut)
async def get_metrics(
    db: AsyncSession = Depends(get_async_db),
    current_user: LMSUser = Depends(get_current_lms_user),
) -> MetricsOut:
    """Return platform-wide metrics (admin only)."""
    _require_admin(current_user)

    user_count = (await db.execute(select(func.count(LMSUser.id)))).scalar() or 0
    course_count = (await db.execute(select(func.count(LMSCourse.id)))).scalar() or 0
    enroll_count = (await db.execute(select(func.count(LMSEnrollment.id)))).scalar() or 0

    return MetricsOut(
        total_users=user_count,
        total_courses=course_count,
        total_enrollments=enroll_count,
    )
