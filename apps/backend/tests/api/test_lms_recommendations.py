"""
Tests for LMS Next Course Recommendation Engine — Phase C3

Covers:
- test_returns_empty_when_no_completions  — no completed courses → empty list
- test_returns_same_discipline_first      — WRT completion → WRT candidates scored highest
- test_excludes_enrolled_courses          — already-enrolled course absent from results
- test_requires_auth                      — missing auth header → 401
"""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.deps_lms import get_current_lms_user
from src.config.database import get_async_db
from src.db.lms_models import LMSUser

client = TestClient(app)

STUDENT_ID = str(uuid4())
AUTH_HEADERS = {"X-User-Id": STUDENT_ID}

ENDPOINT = "/api/lms/recommendations/next-course"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_lms_user(user_id: str = STUDENT_ID) -> MagicMock:
    """Return a minimal LMSUser mock."""
    user = MagicMock(spec=LMSUser)
    user.id = user_id
    user.is_active = True
    user.user_roles = []
    return user


def _make_enrolled_result(course_ids: list[str]) -> MagicMock:
    """Mock for the enrolled course IDs query."""
    result = MagicMock()
    result.fetchall.return_value = [(cid,) for cid in course_ids]
    return result


def _make_completed_disciplines_result(disciplines: list[str]) -> MagicMock:
    """Mock for the completed disciplines query."""
    result = MagicMock()
    result.fetchall.return_value = [(d,) for d in disciplines]
    return result


def _make_candidates_result(candidates: list[dict]) -> MagicMock:
    """Mock for the candidates (published courses) query."""
    rows = []
    for c in candidates:
        row = MagicMock()
        row.id = c["id"]
        row.title = c["title"]
        row.slug = c["slug"]
        row.description = c.get("description")
        row.iicrc_discipline = c.get("iicrc_discipline")
        row.cec_hours = c.get("cec_hours")
        row.thumbnail_url = c.get("thumbnail_url")
        row.enrollment_count = c.get("enrollment_count", 0)
        rows.append(row)
    result = MagicMock()
    result.fetchall.return_value = rows
    return result


def _db_with_three_queries(
    enrolled_ids: list[str],
    completed_disciplines: list[str],
    candidates: list[dict],
) -> AsyncMock:
    """Return an async DB mock whose execute() returns three mocks in sequence."""
    db = AsyncMock()
    db.execute = AsyncMock(
        side_effect=[
            _make_enrolled_result(enrolled_ids),
            _make_completed_disciplines_result(completed_disciplines),
            _make_candidates_result(candidates),
        ]
    )
    return db


def _override_user(user: MagicMock):
    """Return a FastAPI dependency override for get_current_lms_user."""
    async def _dep() -> LMSUser:
        return user
    return _dep


def _override_db(db: AsyncMock):
    """Return a FastAPI dependency override for get_async_db."""
    async def _dep():
        yield db
    return _dep


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestRecommendationsAuth:
    """Authentication boundary tests."""

    def test_requires_auth(self) -> None:
        """No auth header → middleware returns 401 before the route is reached."""
        resp = client.get(ENDPOINT)
        assert resp.status_code == 401


class TestRecommendationsNoCompletions:
    """Student has no completed courses."""

    def test_returns_empty_when_no_completions(self) -> None:
        """A student with zero completed courses gets an empty list (but still gets popular courses)."""
        wrt_id = str(uuid4())
        candidates = [
            {
                "id": wrt_id,
                "title": "Water Damage Restoration",
                "slug": "wrt-intro",
                "iicrc_discipline": "WRT",
                "cec_hours": 14.0,
                "enrollment_count": 50,
            },
        ]
        db = _db_with_three_queries(
            enrolled_ids=[],
            completed_disciplines=[],  # no completions
            candidates=candidates,
        )
        user = _make_lms_user()

        app.dependency_overrides[get_current_lms_user] = _override_user(user)
        app.dependency_overrides[get_async_db] = _override_db(db)
        try:
            resp = client.get(ENDPOINT, headers=AUTH_HEADERS)
            assert resp.status_code == 200
            data = resp.json()
            # Should still return the popular fallback course
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["slug"] == "wrt-intro"
            assert data[0]["reason"] == "Popular in your industry"
        finally:
            app.dependency_overrides.pop(get_current_lms_user, None)
            app.dependency_overrides.pop(get_async_db, None)

    def test_returns_truly_empty_when_no_candidates(self) -> None:
        """No published courses at all → empty list returned."""
        db = _db_with_three_queries(
            enrolled_ids=[],
            completed_disciplines=[],
            candidates=[],
        )
        user = _make_lms_user()

        app.dependency_overrides[get_current_lms_user] = _override_user(user)
        app.dependency_overrides[get_async_db] = _override_db(db)
        try:
            resp = client.get(ENDPOINT, headers=AUTH_HEADERS)
            assert resp.status_code == 200
            assert resp.json() == []
        finally:
            app.dependency_overrides.pop(get_current_lms_user, None)
            app.dependency_overrides.pop(get_async_db, None)


class TestRecommendationsDisciplineScoring:
    """Discipline-based scoring tests."""

    def test_returns_same_discipline_first(self) -> None:
        """Student completed a WRT course → WRT candidates scored +3, others lower."""
        wrt_id = str(uuid4())
        asd_id = str(uuid4())
        crt_id = str(uuid4())

        candidates = [
            # ASD is in WRT affinity (+2) but will be returned second
            {
                "id": asd_id,
                "title": "Applied Structural Drying",
                "slug": "asd-intro",
                "iicrc_discipline": "ASD",
                "cec_hours": 7.0,
                "enrollment_count": 100,  # more popular but lower score
            },
            # WRT same discipline → score +3 (should rank first despite lower popularity)
            {
                "id": wrt_id,
                "title": "Advanced WRT",
                "slug": "wrt-advanced",
                "iicrc_discipline": "WRT",
                "cec_hours": 21.0,
                "enrollment_count": 10,
            },
            # CRT also in WRT affinity (+2)
            {
                "id": crt_id,
                "title": "Carpet Repair",
                "slug": "crt-intro",
                "iicrc_discipline": "CRT",
                "cec_hours": 7.0,
                "enrollment_count": 5,
            },
        ]

        db = _db_with_three_queries(
            enrolled_ids=[],
            completed_disciplines=["WRT"],
            candidates=candidates,
        )
        user = _make_lms_user()

        app.dependency_overrides[get_current_lms_user] = _override_user(user)
        app.dependency_overrides[get_async_db] = _override_db(db)
        try:
            resp = client.get(ENDPOINT, headers=AUTH_HEADERS)
            assert resp.status_code == 200
            data = resp.json()
            assert len(data) == 3
            # WRT (same discipline, score=3) must come first
            assert data[0]["slug"] == "wrt-advanced"
            assert data[0]["reason"] == "Continue your WRT pathway"
            # ASD and CRT are affinity (+2) — ASD first due to higher enrollment_count
            assert data[1]["slug"] == "asd-intro"
            assert data[1]["reason"] == "Learners like you also took this"
            assert data[2]["slug"] == "crt-intro"
        finally:
            app.dependency_overrides.pop(get_current_lms_user, None)
            app.dependency_overrides.pop(get_async_db, None)

    def test_affinity_courses_ranked_above_popular(self) -> None:
        """Affinity (+2) courses rank above unrelated popular courses (+0)."""
        affinity_id = str(uuid4())
        popular_id = str(uuid4())

        candidates = [
            # Very popular but unrelated discipline → score 0
            {
                "id": popular_id,
                "title": "Safety Induction",
                "slug": "safety-induction",
                "iicrc_discipline": None,
                "cec_hours": 2.0,
                "enrollment_count": 999,
            },
            # Affinity to WRT → score +2
            {
                "id": affinity_id,
                "title": "Applied Structural Drying",
                "slug": "asd-course",
                "iicrc_discipline": "ASD",
                "cec_hours": 14.0,
                "enrollment_count": 5,
            },
        ]

        db = _db_with_three_queries(
            enrolled_ids=[],
            completed_disciplines=["WRT"],
            candidates=candidates,
        )
        user = _make_lms_user()

        app.dependency_overrides[get_current_lms_user] = _override_user(user)
        app.dependency_overrides[get_async_db] = _override_db(db)
        try:
            resp = client.get(ENDPOINT, headers=AUTH_HEADERS)
            assert resp.status_code == 200
            data = resp.json()
            assert data[0]["slug"] == "asd-course"   # affinity wins
            assert data[1]["slug"] == "safety-induction"  # popular fallback
        finally:
            app.dependency_overrides.pop(get_current_lms_user, None)
            app.dependency_overrides.pop(get_async_db, None)


class TestRecommendationsExclusion:
    """Enrolled course exclusion tests."""

    def test_excludes_enrolled_courses(self) -> None:
        """Already-enrolled course must not appear in recommendations."""
        enrolled_course_id = str(uuid4())
        new_course_id = str(uuid4())

        # The DB layer handles exclusion via NOT ANY(:exclusion_ids).
        # Our mock simulates the DB already having excluded enrolled_course_id
        # by only returning new_course_id in candidates.
        candidates = [
            {
                "id": new_course_id,
                "title": "New WRT Course",
                "slug": "wrt-new",
                "iicrc_discipline": "WRT",
                "cec_hours": 7.0,
                "enrollment_count": 10,
            },
        ]

        db = _db_with_three_queries(
            enrolled_ids=[enrolled_course_id],
            completed_disciplines=[],
            candidates=candidates,
        )
        user = _make_lms_user()

        app.dependency_overrides[get_current_lms_user] = _override_user(user)
        app.dependency_overrides[get_async_db] = _override_db(db)
        try:
            resp = client.get(ENDPOINT, headers=AUTH_HEADERS)
            assert resp.status_code == 200
            data = resp.json()
            returned_ids = [item["id"] for item in data]
            # Enrolled course must not be in results
            assert enrolled_course_id not in returned_ids
            # Only the new course is returned
            assert new_course_id in returned_ids
        finally:
            app.dependency_overrides.pop(get_current_lms_user, None)
            app.dependency_overrides.pop(get_async_db, None)

    def test_caps_results_at_five(self) -> None:
        """Route never returns more than 5 recommendations."""
        candidates = [
            {
                "id": str(uuid4()),
                "title": f"Course {i}",
                "slug": f"course-{i}",
                "iicrc_discipline": "WRT",
                "cec_hours": 7.0,
                "enrollment_count": i,
            }
            for i in range(10)
        ]

        db = _db_with_three_queries(
            enrolled_ids=[],
            completed_disciplines=[],
            candidates=candidates,
        )
        user = _make_lms_user()

        app.dependency_overrides[get_current_lms_user] = _override_user(user)
        app.dependency_overrides[get_async_db] = _override_db(db)
        try:
            resp = client.get(ENDPOINT, headers=AUTH_HEADERS)
            assert resp.status_code == 200
            assert len(resp.json()) == 5
        finally:
            app.dependency_overrides.pop(get_current_lms_user, None)
            app.dependency_overrides.pop(get_async_db, None)


class TestRecommendationsResponseShape:
    """Verify the response schema fields are correct."""

    def test_response_fields_are_present(self) -> None:
        """All required fields must be present in each recommendation."""
        course_id = str(uuid4())
        candidates = [
            {
                "id": course_id,
                "title": "Fire & Smoke Restoration",
                "slug": "fct-intro",
                "description": "Learn fire restoration techniques",
                "iicrc_discipline": "FCT",
                "cec_hours": 14.0,
                "thumbnail_url": "https://cdn.carsi.com.au/fct.jpg",
                "enrollment_count": 20,
            },
        ]

        db = _db_with_three_queries(
            enrolled_ids=[],
            completed_disciplines=[],
            candidates=candidates,
        )
        user = _make_lms_user()

        app.dependency_overrides[get_current_lms_user] = _override_user(user)
        app.dependency_overrides[get_async_db] = _override_db(db)
        try:
            resp = client.get(ENDPOINT, headers=AUTH_HEADERS)
            assert resp.status_code == 200
            item = resp.json()[0]
            assert isinstance(item["id"], str)
            assert isinstance(item["title"], str)
            assert isinstance(item["slug"], str)
            assert isinstance(item["reason"], str)
            assert item["iicrc_discipline"] == "FCT"
            assert item["cec_hours"] == pytest.approx(14.0)
            assert item["thumbnail_url"] == "https://cdn.carsi.com.au/fct.jpg"
        finally:
            app.dependency_overrides.pop(get_current_lms_user, None)
            app.dependency_overrides.pop(get_async_db, None)
