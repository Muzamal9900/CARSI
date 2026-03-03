"""
Tests for LMS Learning Pathways API

Covers:
- Public pathway listing and detail (no auth required)
- Admin pathway CRUD (create, update, publish/unpublish)
- Course membership (add/remove course from pathway)
- Role-based access control (403 for non-admins on admin routes)
- 404 handling for unknown slugs
"""

from datetime import datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.deps_lms import get_current_lms_user
from src.config.database import get_async_db
from src.db.lms_models import LMSCourse, LMSLearningPathway, LMSLearningPathwayCourse, LMSUser

client = TestClient(app)

ADMIN_ID = uuid4()
STUDENT_ID = uuid4()
PATHWAY_ID = uuid4()
COURSE_ID = uuid4()

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


def make_mock_pathway(is_published: bool = True) -> MagicMock:
    p = MagicMock(spec=LMSLearningPathway)
    p.id = PATHWAY_ID
    p.slug = "wrt-foundation"
    p.title = "Water Damage Restoration Pathway"
    p.description = "Learn WRT fundamentals for IICRC certification."
    p.iicrc_discipline = "WRT"
    p.target_certification = "IICRC WRT"
    p.estimated_hours = Decimal("14.0")
    p.is_published = is_published
    p.order_index = 0
    p.pathway_courses = []
    p.created_at = datetime(2026, 3, 4, 10, 0, 0)
    p.updated_at = datetime(2026, 3, 4, 10, 0, 0)
    return p


def make_mock_course() -> MagicMock:
    c = MagicMock(spec=LMSCourse)
    c.id = COURSE_ID
    c.slug = "wrt-level-1"
    c.title = "WRT Level 1"
    c.iicrc_discipline = "WRT"
    c.cec_hours = Decimal("7.0")
    return c


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


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def clear_overrides():
    yield
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /api/lms/pathways — public list
# ---------------------------------------------------------------------------


class TestListPathways:
    def test_returns_empty_list_when_none_published(self):
        mock_db = make_mock_db()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)

        resp = client.get("/api/lms/pathways")

        assert resp.status_code == 200
        body = resp.json()
        assert body["items"] == []
        assert body["total"] == 0

    def test_returns_published_pathways(self):
        mock_db = make_mock_db()
        pathway = make_mock_pathway()
        result = MagicMock()
        result.scalar.return_value = 1
        result.scalars.return_value.all.return_value = [pathway]
        mock_db.execute = AsyncMock(return_value=result)
        app.dependency_overrides[get_async_db] = _override_db(mock_db)

        resp = client.get("/api/lms/pathways")

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["items"][0]["slug"] == "wrt-foundation"
        assert body["items"][0]["iicrc_discipline"] == "WRT"

    def test_no_auth_required(self):
        """Public endpoint — no X-User-Id header needed."""
        mock_db = make_mock_db()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)

        resp = client.get("/api/lms/pathways")

        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# GET /api/lms/pathways/{slug} — public detail
# ---------------------------------------------------------------------------


class TestGetPathway:
    def test_404_for_unknown_slug(self):
        mock_db = make_mock_db()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)

        resp = client.get("/api/lms/pathways/does-not-exist")

        assert resp.status_code == 404

    def test_returns_pathway_with_courses(self):
        mock_db = make_mock_db()
        pathway = make_mock_pathway()
        pc = MagicMock(spec=LMSLearningPathwayCourse)
        pc.course_id = COURSE_ID
        pc.order_index = 0
        pc.is_required = True
        pc.course = make_mock_course()
        pathway.pathway_courses = [pc]

        result = MagicMock()
        result.scalar_one_or_none.return_value = pathway
        mock_db.execute = AsyncMock(return_value=result)
        app.dependency_overrides[get_async_db] = _override_db(mock_db)

        resp = client.get("/api/lms/pathways/wrt-foundation")

        assert resp.status_code == 200
        body = resp.json()
        assert body["slug"] == "wrt-foundation"
        assert len(body["courses"]) == 1
        assert body["courses"][0]["course_slug"] == "wrt-level-1"
        assert body["courses"][0]["is_required"] is True

    def test_unpublished_pathway_returns_404(self):
        """Unpublished pathways are not visible on the public endpoint."""
        mock_db = make_mock_db()
        # scalar_one_or_none returns None because query filters is_published=true
        app.dependency_overrides[get_async_db] = _override_db(mock_db)

        resp = client.get("/api/lms/pathways/wrt-foundation")

        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/lms/admin/pathways — admin create
# ---------------------------------------------------------------------------


class TestCreatePathway:
    PAYLOAD = {
        "slug": "crt-mastery",
        "title": "Carpet Restoration Mastery Pathway",
        "iicrc_discipline": "CRT",
        "description": "Full CRT journey",
    }

    def test_admin_can_create_pathway(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()

        def _populate_pathway(obj):
            obj.id = PATHWAY_ID
            obj.is_published = False
            obj.order_index = 0
            obj.created_at = datetime(2026, 3, 4, 10, 0, 0)
            obj.updated_at = datetime(2026, 3, 4, 10, 0, 0)

        mock_db.refresh = AsyncMock(side_effect=_populate_pathway)

        result_none = MagicMock()
        result_none.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result_none)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post("/api/lms/admin/pathways", json=self.PAYLOAD, headers=ADMIN_HEADERS)

        assert resp.status_code == 201
        assert mock_db.add.called
        assert mock_db.commit.called

    def test_student_cannot_create_pathway(self):
        mock_db = make_mock_db()
        student = make_mock_student()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(student)

        resp = client.post("/api/lms/admin/pathways", json=self.PAYLOAD, headers=STUDENT_HEADERS)

        assert resp.status_code == 403

    def test_duplicate_slug_returns_409(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        existing = make_mock_pathway()
        result = MagicMock()
        result.scalar_one_or_none.return_value = existing
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post("/api/lms/admin/pathways", json=self.PAYLOAD, headers=ADMIN_HEADERS)

        assert resp.status_code == 409

    def test_missing_required_fields_returns_422(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post("/api/lms/admin/pathways", json={"slug": "only-slug"}, headers=ADMIN_HEADERS)

        assert resp.status_code == 422

    def test_invalid_slug_pattern_returns_422(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post(
            "/api/lms/admin/pathways",
            json={"slug": "INVALID SLUG!", "title": "Test"},
            headers=ADMIN_HEADERS,
        )

        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# PATCH /api/lms/admin/pathways/{slug}
# ---------------------------------------------------------------------------


class TestUpdatePathway:
    def test_admin_can_publish_pathway(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        pathway = make_mock_pathway(is_published=False)
        result = MagicMock()
        result.scalar_one_or_none.return_value = pathway
        mock_db.execute = AsyncMock(return_value=result)
        mock_db.refresh = AsyncMock()

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.patch("/api/lms/admin/pathways/wrt-foundation", json={"is_published": True}, headers=ADMIN_HEADERS)

        assert resp.status_code == 200
        assert mock_db.commit.called

    def test_update_404_for_unknown_slug(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.patch("/api/lms/admin/pathways/ghost-pathway", json={"title": "New Title"}, headers=ADMIN_HEADERS)

        assert resp.status_code == 404

    def test_student_cannot_update_pathway(self):
        mock_db = make_mock_db()
        student = make_mock_student()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(student)

        resp = client.patch("/api/lms/admin/pathways/wrt-foundation", json={"title": "Hack"}, headers=STUDENT_HEADERS)

        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/lms/admin/pathways/{slug}/courses — add course to pathway
# ---------------------------------------------------------------------------


class TestAddCourseToPathway:
    def test_admin_can_add_course(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        pathway = make_mock_pathway()
        course = make_mock_course()

        calls = [
            MagicMock(**{"scalar_one_or_none.return_value": pathway}),
            MagicMock(**{"scalar_one_or_none.return_value": course}),
            MagicMock(**{"scalar_one_or_none.return_value": None}),
        ]
        mock_db.execute = AsyncMock(side_effect=calls)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post(
            "/api/lms/admin/pathways/wrt-foundation/courses",
            json={"course_id": str(COURSE_ID), "order_index": 0, "is_required": True},
            headers=ADMIN_HEADERS,
        )

        assert resp.status_code == 201
        body = resp.json()
        assert str(body["course_id"]) == str(COURSE_ID)
        assert body["course_slug"] == "wrt-level-1"

    def test_duplicate_course_returns_409(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        pathway = make_mock_pathway()
        course = make_mock_course()
        existing_pc = MagicMock(spec=LMSLearningPathwayCourse)

        calls = [
            MagicMock(**{"scalar_one_or_none.return_value": pathway}),
            MagicMock(**{"scalar_one_or_none.return_value": course}),
            MagicMock(**{"scalar_one_or_none.return_value": existing_pc}),
        ]
        mock_db.execute = AsyncMock(side_effect=calls)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post(
            "/api/lms/admin/pathways/wrt-foundation/courses",
            json={"course_id": str(COURSE_ID), "order_index": 0},
            headers=ADMIN_HEADERS,
        )

        assert resp.status_code == 409

    def test_pathway_not_found_returns_404(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.post(
            "/api/lms/admin/pathways/ghost/courses",
            json={"course_id": str(COURSE_ID), "order_index": 0},
            headers=ADMIN_HEADERS,
        )

        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /api/lms/admin/pathways/{slug}/courses/{course_id}
# ---------------------------------------------------------------------------


class TestRemoveCourseFromPathway:
    def test_admin_can_remove_course(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        pathway = make_mock_pathway()
        pc = MagicMock(spec=LMSLearningPathwayCourse)

        calls = [
            MagicMock(**{"scalar_one_or_none.return_value": pathway}),
            MagicMock(**{"scalar_one_or_none.return_value": pc}),
        ]
        mock_db.execute = AsyncMock(side_effect=calls)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.delete(f"/api/lms/admin/pathways/wrt-foundation/courses/{COURSE_ID}", headers=ADMIN_HEADERS)

        assert resp.status_code == 204
        assert mock_db.delete.called

    def test_returns_404_when_course_not_in_pathway(self):
        mock_db = make_mock_db()
        admin = make_mock_admin()
        pathway = make_mock_pathway()

        calls = [
            MagicMock(**{"scalar_one_or_none.return_value": pathway}),
            MagicMock(**{"scalar_one_or_none.return_value": None}),
        ]
        mock_db.execute = AsyncMock(side_effect=calls)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(admin)

        resp = client.delete(f"/api/lms/admin/pathways/wrt-foundation/courses/{uuid4()}", headers=ADMIN_HEADERS)

        assert resp.status_code == 404
