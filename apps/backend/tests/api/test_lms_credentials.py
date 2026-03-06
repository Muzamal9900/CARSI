"""
Tests for LMS Credentials API — student wallet endpoint
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.deps_lms import get_current_lms_user
from src.config.database import get_async_db
from src.db.lms_models import LMSCourse, LMSEnrollment, LMSUser

client = TestClient(app)

AUTH_HEADERS = {"X-User-Id": "00000000-0000-0000-0000-000000000001"}
STUDENT_ID = uuid4()
ENROLLMENT_ID = uuid4()
COURSE_ID = uuid4()


def _make_user_role(role_name: str) -> MagicMock:
    role = MagicMock()
    role.name = role_name
    ur = MagicMock()
    ur.role = role
    return ur


def make_mock_student() -> MagicMock:
    user = MagicMock(spec=LMSUser)
    user.id = STUDENT_ID
    user.email = "student@test.com"
    user.full_name = "Test Student"
    user.is_active = True
    user.user_roles = [_make_user_role("student")]
    return user


def make_mock_course() -> MagicMock:
    course = MagicMock(spec=LMSCourse)
    course.id = COURSE_ID
    course.title = "WRT Fundamentals"
    course.iicrc_discipline = "WRT"
    course.cec_hours = 8.0
    course.cppp40421_unit_code = "CPPCLO3003"
    return course


def make_mock_enrollment(status: str = "completed") -> MagicMock:
    enrollment = MagicMock(spec=LMSEnrollment)
    enrollment.id = ENROLLMENT_ID
    enrollment.student_id = STUDENT_ID
    enrollment.course_id = COURSE_ID
    enrollment.status = status
    enrollment.enrolled_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    enrollment.completed_at = datetime(2026, 2, 15, tzinfo=timezone.utc)
    enrollment.course = make_mock_course()
    return enrollment


def make_mock_db() -> AsyncMock:
    db = AsyncMock()
    result = MagicMock()
    result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=result)
    return db


def _override_db(mock_db: AsyncMock):
    async def _get_db():
        yield mock_db
    return _get_db


def _override_user(mock_user):
    def _get_user():
        return mock_user
    return _get_user


class TestGetMyCredentials:
    def test_returns_empty_list_when_no_completed_enrollments(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        resp = client.get("/api/lms/credentials/me", headers=AUTH_HEADERS)
        assert resp.status_code == 200
        assert resp.json() == []

        app.dependency_overrides.clear()

    def test_returns_credentials_for_completed_enrollments(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()
        mock_enrollment = make_mock_enrollment(status="completed")

        result = MagicMock()
        result.scalars.return_value.all.return_value = [mock_enrollment]
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        resp = client.get("/api/lms/credentials/me", headers=AUTH_HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["credential_id"] == str(ENROLLMENT_ID)
        assert data[0]["course_title"] == "WRT Fundamentals"
        assert data[0]["iicrc_discipline"] == "WRT"
        assert data[0]["cec_hours"] == 8.0
        assert data[0]["status"] == "completed"

        app.dependency_overrides.clear()

    def test_requires_authentication(self):
        resp = client.get("/api/lms/credentials/me")
        assert resp.status_code == 401
