"""
CARSI LMS FastAPI Dependencies

Provides get_current_lms_user() and require_role() for LMS route protection.
These work alongside the existing starter auth system using lms_users table.
"""

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.auth.jwt import extract_user_email
from src.config.database import get_async_db
from src.db.lms_models import LMSUser, LMSUserRole, LMSRole

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_lms_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    x_user_id: str | None = Header(default=None),
    db: AsyncSession = Depends(get_async_db),
) -> LMSUser:
    """
    Resolve the current LMS user from:
      1. Bearer JWT token (production)
      2. X-User-Id header (dev fallback — looked up by UUID)
    """
    user: LMSUser | None = None

    if credentials:
        email = extract_user_email(credentials.credentials)
        if email:
            result = await db.execute(
                select(LMSUser)
                .where(LMSUser.email == email)
                .options(selectinload(LMSUser.user_roles).selectinload(LMSUserRole.role))
            )
            user = result.scalar_one_or_none()

    if user is None and x_user_id:
        try:
            uid = UUID(x_user_id)
        except ValueError:
            pass
        else:
            result = await db.execute(
                select(LMSUser)
                .where(LMSUser.id == uid)
                .options(selectinload(LMSUser.user_roles).selectinload(LMSUserRole.role))
            )
            user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    return user


def require_role(allowed_roles: list[str]) -> Callable:
    """
    Dependency factory: require the current LMS user to have one of the allowed roles.

    Usage:
        @router.post("/courses")
        async def create_course(
            current_user: LMSUser = Depends(require_role(["instructor", "admin"]))
        ):
    """

    async def _check_role(
        current_user: LMSUser = Depends(get_current_lms_user),
    ) -> LMSUser:
        user_roles = [ur.role.name for ur in current_user.user_roles if ur.role]
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {', '.join(allowed_roles)}",
            )
        return current_user

    return _check_role
