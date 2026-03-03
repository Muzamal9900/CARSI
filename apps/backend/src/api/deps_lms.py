"""
CARSI LMS FastAPI Dependencies

Provides get_current_lms_user() and require_role() for LMS route protection.
These work alongside the existing starter auth system using lms_users table.
"""

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
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
    db: AsyncSession = Depends(get_async_db),
) -> LMSUser:
    """
    Resolve the current LMS user from Bearer JWT token.
    Uses lms_users table (separate from starter's users table).
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = extract_user_email(credentials.credentials)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(LMSUser)
        .where(LMSUser.email == email)
        .options(selectinload(LMSUser.user_roles).selectinload(LMSUserRole.role))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="LMS user not found",
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
