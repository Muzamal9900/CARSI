"""
Tests for Quiz AI Explanation endpoint — Phase C4.

GET /api/lms/quiz/questions/{question_id}/explanation
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

QUESTION_ID = uuid4()

_CACHED_EXPLANATION = {
    "correct_answer": "Option A",
    "explanation": "Option A is correct because it follows the IICRC standard.",
    "study_tip": "Review Lesson 3 on moisture measurement.",
    "generated_at": "2026-03-18T00:00:00+00:00",
}


def _make_user_role(role_name: str) -> MagicMock:
    role = MagicMock()
    role.name = role_name
    ur = MagicMock()
    ur.role = role
    return ur


def make_mock_student() -> MagicMock:
    user = MagicMock(spec=LMSUser)
    user.id = uuid4()
    user.email = "student@test.com"
    user.full_name = "Test Student"
    user.is_active = True
    user.user_roles = [_make_user_role("student")]
    return user


class TestGetQuestionExplanation:
    def test_returns_cached_explanation(self):
        """
        When question.ai_explanation is already set, the endpoint returns it
        immediately without calling the generation service.
        """
        mock_question = MagicMock()
        mock_question.id = QUESTION_ID
        mock_question.ai_explanation = _CACHED_EXPLANATION

        mock_db_result = MagicMock()
        mock_db_result.scalar_one_or_none.return_value = mock_question

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=mock_db_result)

        app.dependency_overrides[get_async_db] = lambda: mock_db
        app.dependency_overrides[get_current_lms_user] = lambda: make_mock_student()

        with patch(
            "src.services.quiz_explanation_service.generate_quiz_explanation"
        ) as mock_gen:
            response = client.get(
                f"/api/lms/quiz/questions/{QUESTION_ID}/explanation",
                headers=AUTH_HEADERS,
            )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        payload = response.json()
        assert payload["question_id"] == str(QUESTION_ID)
        assert payload["explanation"]["correct_answer"] == "Option A"
        mock_gen.assert_not_called()

    def test_generates_explanation_when_not_cached(self):
        """
        When question.ai_explanation is None, the service is called, the result
        is saved to the question, and the endpoint returns the generated data.
        """
        mock_question = MagicMock()
        mock_question.id = QUESTION_ID
        mock_question.quiz_id = uuid4()
        mock_question.question_text = "What does WRT stand for?"
        mock_question.options = [
            {"text": "Water Restoration Technician", "is_correct": True},
            {"text": "Wet Removal Tool", "is_correct": False},
        ]
        mock_question.ai_explanation = None

        mock_db_result = MagicMock()
        mock_db_result.scalar_one_or_none.return_value = mock_question

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=mock_db_result)
        mock_db.commit = AsyncMock()

        generated = {
            "correct_answer": "Water Restoration Technician",
            "explanation": "WRT stands for Water Restoration Technician per IICRC.",
            "study_tip": "Review the IICRC S500 standard introduction.",
            "generated_at": "2026-03-18T00:00:00+00:00",
        }

        app.dependency_overrides[get_async_db] = lambda: mock_db
        app.dependency_overrides[get_current_lms_user] = lambda: make_mock_student()

        with patch(
            "src.services.quiz_explanation_service.generate_quiz_explanation",
            new=AsyncMock(return_value=generated),
        ):
            response = client.get(
                f"/api/lms/quiz/questions/{QUESTION_ID}/explanation",
                headers=AUTH_HEADERS,
            )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        payload = response.json()
        assert payload["explanation"]["correct_answer"] == "Water Restoration Technician"
        # Verify the result was cached back to the ORM object
        assert mock_question.ai_explanation == generated
        mock_db.commit.assert_awaited_once()

    def test_requires_auth(self):
        """No X-User-Id header → 401 from auth middleware."""
        response = client.get(
            f"/api/lms/quiz/questions/{QUESTION_ID}/explanation"
        )
        assert response.status_code == 401
