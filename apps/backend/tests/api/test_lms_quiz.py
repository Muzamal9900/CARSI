"""
Tests for LMS Quiz API — Phase 11 (GP-107)

Covers GET /api/lms/quizzes/{quiz_id} and POST /api/lms/quizzes/{quiz_id}/submit
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

AUTH_HEADERS = {"X-User-Id": "00000000-0000-0000-0000-000000000001"}

QUIZ_ID = uuid4()
Q1_ID = uuid4()
Q2_ID = uuid4()
STUDENT_ID = uuid4()


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


def make_mock_question(qid, correct_idx: int = 0) -> MagicMock:
    q = MagicMock()
    q.id = qid
    q.question_text = "What is the first step in water damage restoration?"
    q.question_type = "multiple_choice"
    q.options = [
        {"text": "Extract water", "is_correct": correct_idx == 0},
        {"text": "Paint the walls", "is_correct": correct_idx == 1},
    ]
    q.explanation = "Water extraction is always the first step."
    q.order_index = 1
    q.points = 1
    return q


def make_mock_quiz(attempts_used: int = 0) -> MagicMock:
    quiz = MagicMock()
    quiz.id = QUIZ_ID
    quiz.title = "Water Damage Basics Quiz"
    quiz.pass_percentage = 70
    quiz.time_limit_minutes = 30
    quiz.attempts_allowed = 3
    quiz.questions = [make_mock_question(Q1_ID, 0), make_mock_question(Q2_ID, 1)]
    quiz.attempts = [MagicMock(student_id=STUDENT_ID) for _ in range(attempts_used)]
    return quiz


def make_mock_db() -> AsyncMock:
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    result.scalar.return_value = 0
    db.execute = AsyncMock(return_value=result)
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
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


class TestGetQuiz:
    def test_requires_auth(self):
        response = client.get(f"/api/lms/quizzes/{QUIZ_ID}")
        assert response.status_code == 401

    def test_quiz_not_found_returns_404(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()

        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        response = client.get(f"/api/lms/quizzes/{QUIZ_ID}", headers=AUTH_HEADERS)
        assert response.status_code == 404

    def test_returns_quiz_with_questions(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()
        mock_quiz = make_mock_quiz()

        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_quiz
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        response = client.get(f"/api/lms/quizzes/{QUIZ_ID}", headers=AUTH_HEADERS)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Water Damage Basics Quiz"
        assert data["pass_percentage"] == 70
        assert len(data["questions"]) == 2
        # is_correct must be stripped from options for students
        for q in data["questions"]:
            for opt in q["options"]:
                assert "is_correct" not in opt


class TestSubmitQuiz:
    def test_requires_auth(self):
        response = client.post(
            f"/api/lms/quizzes/{QUIZ_ID}/submit",
            json={"answers": {str(Q1_ID): 0, str(Q2_ID): 1}},
        )
        assert response.status_code == 401

    def test_quiz_not_found_returns_404(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()

        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        response = client.post(
            f"/api/lms/quizzes/{QUIZ_ID}/submit",
            json={"answers": {str(Q1_ID): 0}},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 404

    def test_calculates_score_and_returns_result(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()
        mock_quiz = make_mock_quiz()

        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_quiz
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        # Q1 correct (idx 0), Q2 correct (idx 1) → 100%
        with patch("src.worker.tasks.handle_quiz_passed.delay"):
            response = client.post(
                f"/api/lms/quizzes/{QUIZ_ID}/submit",
                json={"answers": {str(Q1_ID): 0, str(Q2_ID): 1}},
                headers=AUTH_HEADERS,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["score_percentage"] == 100.0
        assert data["passed"] is True

    def test_fails_when_below_pass_percentage(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()
        mock_quiz = make_mock_quiz()

        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_quiz
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        # Q1 correct, Q2 wrong → 50% < 70% pass_percentage
        response = client.post(
            f"/api/lms/quizzes/{QUIZ_ID}/submit",
            json={"answers": {str(Q1_ID): 0, str(Q2_ID): 0}},
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["score_percentage"] == 50.0
        assert data["passed"] is False

    def test_rejects_when_attempts_exhausted(self):
        mock_db = make_mock_db()
        mock_student = make_mock_student()
        # 3 previous attempts = at limit
        mock_quiz = make_mock_quiz(attempts_used=3)

        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_quiz
        mock_db.execute = AsyncMock(return_value=result)

        app.dependency_overrides[get_async_db] = _override_db(mock_db)
        app.dependency_overrides[get_current_lms_user] = _override_user(mock_student)

        response = client.post(
            f"/api/lms/quizzes/{QUIZ_ID}/submit",
            json={"answers": {str(Q1_ID): 0}},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 403
