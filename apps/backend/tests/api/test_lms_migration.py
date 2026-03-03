"""
Tests for LMS Migration Pipeline API

Covers:
- POST /api/lms/admin/migration/discover — Drive scan, demo manifest in disabled mode
- GET  /api/lms/admin/migration/jobs     — list jobs
- GET  /api/lms/admin/migration/jobs/{id} — single job
- POST /api/lms/admin/migration/load     — load approved items into DB
- Role-based access control (students cannot access admin migration routes)
- Slug parsing helpers (_slugify, _detect_discipline, _parse_cec_hours)
"""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.deps_lms import get_current_lms_user
from src.api.routes.lms_migration import _slugify, _detect_discipline, _parse_cec_hours
from src.config.database import get_async_db
from src.db.lms_models import LMSMigrationJob, LMSUser

client = TestClient(app)

ADMIN_ID = uuid4()
STUDENT_ID = uuid4()
JOB_ID = uuid4()

ADMIN_HEADERS = {"X-User-Id": str(ADMIN_ID)}
STUDENT_HEADERS = {"X-User-Id": str(STUDENT_ID)}


# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------


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
    user.roles = ["admin"]
    return user


def make_mock_student() -> MagicMock:
    user = MagicMock(spec=LMSUser)
    user.id = STUDENT_ID
    user.email = "student@test.com"
    user.full_name = "Test Student"
    user.is_active = True
    user.user_roles = [_make_user_role("student")]
    user.roles = ["student"]
    return user


def make_mock_job(
    job_type: str = "discover",
    status: str = "completed",
    manifest: list | None = None,
) -> MagicMock:
    job = MagicMock(spec=LMSMigrationJob)
    job.id = JOB_ID
    job.job_type = job_type
    job.status = status
    job.total_items = 3
    job.processed_items = 3
    job.failed_items = 0
    job.result_manifest = manifest or [
        {"drive_file_id": "abc", "drive_name": "WRT Level 1", "proposed_slug": "wrt-level-1",
         "proposed_title": "WRT Level 1", "iicrc_discipline": "WRT", "cec_hours": 7.0,
         "mime_type": "application/vnd.google-apps.folder", "status": "discovered"},
    ]
    job.error_log = []
    job.created_at = datetime(2026, 3, 4, 10, 0, 0)
    job.updated_at = datetime(2026, 3, 4, 10, 0, 0)
    return job


def make_mock_db() -> AsyncMock:
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    result.scalar.return_value = 0
    result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=result)
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.delete = AsyncMock()
    return db


def _override_db(mock_db: AsyncMock):
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


# ---------------------------------------------------------------------------
# Unit tests — pure utility functions (no HTTP)
# ---------------------------------------------------------------------------


class TestSlugify:
    def test_basic_name(self):
        assert _slugify("Water Damage Restoration") == "water-damage-restoration"

    def test_handles_special_characters(self):
        assert _slugify("WRT: Level 1 (Basics)") == "wrt-level-1-basics"

    def test_handles_underscores(self):
        assert _slugify("course_name_here") == "course-name-here"

    def test_truncates_to_255(self):
        long_name = "a" * 300
        assert len(_slugify(long_name)) <= 255

    def test_strips_leading_trailing_hyphens(self):
        result = _slugify("  --Water Damage--  ")
        assert not result.startswith("-")
        assert not result.endswith("-")


class TestDetectDiscipline:
    def test_detects_wrt_by_keyword(self):
        assert _detect_discipline("WRT Foundation Module") == "WRT"

    def test_detects_crt_by_carpet(self):
        assert _detect_discipline("Carpet Cleaning Basics") == "CRT"

    def test_detects_oct_by_odour(self):
        assert _detect_discipline("Odour Control Technician") == "OCT"

    def test_detects_asd(self):
        assert _detect_discipline("Applied Structural Drying") == "ASD"

    def test_returns_none_for_unknown(self):
        assert _detect_discipline("General Workplace Safety") is None

    def test_case_insensitive(self):
        assert _detect_discipline("wrt fundamentals") == "WRT"


class TestParseCecHours:
    def test_parses_integer_cec(self):
        assert _parse_cec_hours("Course 3 CEC hours") == 3.0

    def test_parses_decimal_cec(self):
        assert _parse_cec_hours("Water Damage 1.5 CEC") == 1.5

    def test_parses_cecs_no_space(self):
        assert _parse_cec_hours("Course2.0CECs") == 2.0

    def test_returns_none_when_no_match(self):
        assert _parse_cec_hours("No credits here") is None

    def test_case_insensitive(self):
        assert _parse_cec_hours("course 4 cec") == 4.0


# ---------------------------------------------------------------------------
# POST /api/lms/admin/migration/discover
# ---------------------------------------------------------------------------


class TestDiscover:
    def test_student_cannot_trigger_discovery(self):
        mock_db = make_mock_db()
        student = make_mock_student()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(student)

        resp = client.post("/api/lms/admin/migration/discover", json={}, headers=STUDENT_HEADERS)

        assert resp.status_code == 403

    def test_discover_returns_202_with_disabled_drive(self):
        """In disabled Drive mode, returns a demo manifest of 3 items."""
        mock_db = make_mock_db()
        admin = make_mock_admin()

        def _populate_job(obj):
            obj.id = JOB_ID
            if obj.failed_items is None:
                obj.failed_items = 0
            if obj.error_log is None:
                obj.error_log = []
            obj.created_at = datetime(2026, 3, 4, 10, 0, 0)
            obj.updated_at = datetime(2026, 3, 4, 10, 0, 0)

        mock_db.refresh = AsyncMock(side_effect=_populate_job)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        disabled_drive = MagicMock()
        disabled_drive.is_disabled = True

        with patch("src.api.routes.lms_migration._get_drive_service", return_value=disabled_drive, create=True):
            with patch("src.api.routes.lms_drive._get_drive_service", return_value=disabled_drive, create=True):
                resp = client.post("/api/lms/admin/migration/discover", json={}, headers=ADMIN_HEADERS)

        assert resp.status_code == 202

    def test_discover_no_auth_returns_401(self):
        mock_db = make_mock_db()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)

        resp = client.post("/api/lms/admin/migration/discover", json={})

        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/lms/admin/migration/jobs
# ---------------------------------------------------------------------------


class TestListJobs:
    def test_admin_can_list_jobs(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        job = make_mock_job()
        result = MagicMock()
        result.scalars.return_value.all.return_value = [job]
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.get("/api/lms/admin/migration/jobs", headers=ADMIN_HEADERS)

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["items"][0]["job_type"] == "discover"
        assert body["items"][0]["status"] == "completed"

    def test_student_cannot_list_jobs(self):
        mock_db = make_mock_db()
        student = make_mock_student()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(student)

        resp = client.get("/api/lms/admin/migration/jobs", headers=STUDENT_HEADERS)

        assert resp.status_code == 403

    def test_returns_empty_when_no_jobs(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.get("/api/lms/admin/migration/jobs", headers=ADMIN_HEADERS)

        assert resp.status_code == 200
        assert resp.json()["total"] == 0


# ---------------------------------------------------------------------------
# GET /api/lms/admin/migration/jobs/{job_id}
# ---------------------------------------------------------------------------


class TestGetJob:
    def test_admin_can_get_specific_job(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        job = make_mock_job()
        result = MagicMock()
        result.scalar_one_or_none.return_value = job
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.get(f"/api/lms/admin/migration/jobs/{JOB_ID}", headers=ADMIN_HEADERS)

        assert resp.status_code == 200
        assert resp.json()["job_type"] == "discover"

    def test_returns_404_for_unknown_job(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.get(f"/api/lms/admin/migration/jobs/{uuid4()}", headers=ADMIN_HEADERS)

        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/lms/admin/migration/load
# ---------------------------------------------------------------------------


class TestLoadJob:
    def test_load_fails_when_job_not_found(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post(
            "/api/lms/admin/migration/load",
            json={"job_id": str(uuid4())},
            headers=ADMIN_HEADERS,
        )

        assert resp.status_code == 404

    def test_load_fails_when_job_not_completed(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        running_job = make_mock_job(status="running")
        result = MagicMock()
        result.scalar_one_or_none.return_value = running_job
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post(
            "/api/lms/admin/migration/load",
            json={"job_id": str(JOB_ID)},
            headers=ADMIN_HEADERS,
        )

        assert resp.status_code == 409

    def test_load_skips_existing_slugs(self):
        """If a slug already exists in the DB, the item is skipped without error."""
        mock_db = make_mock_db()
        admin = make_mock_admin()
        disc_job = make_mock_job(status="completed")
        existing_course = MagicMock()

        calls = [
            MagicMock(**{"scalar_one_or_none.return_value": disc_job}),
            MagicMock(**{"scalar_one_or_none.return_value": existing_course}),
            MagicMock(**{"scalar_one_or_none.return_value": None}),
        ]
        mock_db.execute = AsyncMock(side_effect=calls)
        mock_db.flush = AsyncMock()

        def _populate_load_job(obj):
            obj.id = JOB_ID
            if obj.result_manifest is None:
                obj.result_manifest = []
            if obj.error_log is None:
                obj.error_log = []
            obj.created_at = datetime(2026, 3, 4, 10, 0, 0)
            obj.updated_at = datetime(2026, 3, 4, 10, 0, 0)

        mock_db.refresh = AsyncMock(side_effect=_populate_load_job)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post(
            "/api/lms/admin/migration/load",
            json={"job_id": str(JOB_ID)},
            headers=ADMIN_HEADERS,
        )

        assert resp.status_code == 202

    def test_student_cannot_load(self):
        mock_db = make_mock_db()
        student = make_mock_student()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(student)

        resp = client.post(
            "/api/lms/admin/migration/load",
            json={"job_id": str(JOB_ID)},
            headers=STUDENT_HEADERS,
        )

        assert resp.status_code == 403
