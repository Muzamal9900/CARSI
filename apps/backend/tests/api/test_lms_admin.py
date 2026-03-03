"""
Tests for LMS Admin API — Phase 13 (GP-109)

Covers GET /api/lms/admin/users, PATCH /api/lms/admin/users/{id}/role,
and GET /api/lms/admin/metrics
"""

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.deps_lms import get_current_lms_user
from src.config.database import get_async_db
from src.db.lms_models import LMSUser

client = TestClient(app)

AUTH_HEADERS = {"X-User-Id": "00000000-0000-0000-0000-000000000001"}

ADMIN_ID = uuid4()
USER_ID = uuid4()


def _make_user_role(role_name: str) -> MagicMock:
    role = MagicMock()
    role.name = role_name
    ur = MagicMock()
    ur.role = role
    return ur


def make_mock_admin() -> MagicMock:
    user = MagicMock(spec=LMSUser)
    user.id = ADMIN_ID
    user.email = "admin@test.com"
    user.full_name = "Test Admin"
    user.is_active = True
    user.user_roles = [_make_user_role("admin")]
    return user


def make_mock_student() -> MagicMock:
    user = MagicMock(spec=LMSUser)
    user.id = USER_ID
    user.email = "student@test.com"
    user.full_name = "Test Student"
    user.is_active = True
    user.user_roles = [_make_user_role("student")]
    return user


def make_mock_db() -> AsyncMock:
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    result.scalar.return_value = 0
    result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=result)
    db.add = MagicMock()
    db.commit = AsyncMock()
    return db


def _override_db(mock_db):
    async def _dep():
        yield mock_db

    return _dep


def _override_user(mock_user):
    async def _dep():
        return mock_user

    return _dep


@pytest.fixture(autouse=True)
def clear_overrides():
    yield
    app.dependency_overrides.clear()


class TestListUsers:
    def test_requires_auth(self):
        response = client.get("/api/lms/admin/users")
        assert response.status_code == 401

    def test_non_admin_forbidden(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        response = client.get("/api/lms/admin/users", headers=AUTH_HEADERS)
        assert response.status_code == 403

    def test_returns_user_list(self):
        mock_db = make_mock_db()
        mock_admin = make_mock_admin()
        mock_student = make_mock_student()

        result = MagicMock()
        result.scalars.return_value.all.return_value = [mock_student]
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_admin)

        response = client.get("/api/lms/admin/users", headers=AUTH_HEADERS)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["email"] == "student@test.com"


class TestGetMetrics:
    def test_requires_auth(self):
        response = client.get("/api/lms/admin/metrics")
        assert response.status_code == 401

    def test_non_admin_forbidden(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        response = client.get("/api/lms/admin/metrics", headers=AUTH_HEADERS)
        assert response.status_code == 403

    def test_returns_metric_counts(self):
        mock_db = make_mock_db()
        mock_admin = make_mock_admin()

        result = MagicMock()
        result.scalar.return_value = 42
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_admin)

        response = client.get("/api/lms/admin/metrics", headers=AUTH_HEADERS)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_courses" in data
        assert "total_enrollments" in data


class TestUpdateUserRole:
    def test_requires_auth(self):
        response = client.patch(
            f"/api/lms/admin/users/{USER_ID}/role",
            json={"role": "instructor"},
        )
        assert response.status_code == 401

    def test_non_admin_forbidden(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        response = client.patch(
            f"/api/lms/admin/users/{USER_ID}/role",
            json={"role": "instructor"},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 403

    def test_user_not_found_returns_404(self):
        mock_db = make_mock_db()
        mock_admin = make_mock_admin()

        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_admin)

        response = client.patch(
            f"/api/lms/admin/users/{USER_ID}/role",
            json={"role": "instructor"},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 404
