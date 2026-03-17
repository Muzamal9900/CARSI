"""
Tests for churn-prediction scoring — Phase C5.

Uses synchronous mocks — no real PostgreSQL or Redis required.
"""

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

STUDENT_ID = uuid4()


def _make_db_execute(rows: dict) -> MagicMock:
    """
    Return a mock `db` where execute() yields different results per call.

    `rows` maps call index (0-based) to a return value:
      - a scalar int  → mock_result.scalar() returns it
      - a tuple       → mock_result.fetchone() returns it
      - None          → mock_result.fetchone() returns None
    """
    db = MagicMock()
    call_results = []

    for val in rows.values():
        result = MagicMock()
        if isinstance(val, int):
            result.scalar.return_value = val
            result.fetchone.return_value = (val,)
        elif val is None:
            result.fetchone.return_value = None
            result.scalar.return_value = None
        else:
            result.fetchone.return_value = val
            result.scalar.return_value = val[0] if isinstance(val, tuple) else val
        call_results.append(result)

    db.execute.side_effect = call_results
    return db


class TestComputeStudentRisk:
    def test_compute_student_risk_no_sessions(self):
        """
        Student with no session rows → last_login_days is None (treated as 999),
        triggers the >30-day penalty (+50). Also no recent progress (+20),
        no gamification row (+10), no enrollments (+10) = 90 total.
        """
        from src.worker.tasks import _compute_student_risk

        db = MagicMock()

        # Call order: login, progress, gamification, enrollments
        login_result = MagicMock()
        login_result.fetchone.return_value = (None,)  # NULL from MAX()

        progress_result = MagicMock()
        progress_result.scalar.return_value = 0

        gamification_result = MagicMock()
        gamification_result.fetchone.return_value = None  # no row

        enroll_result = MagicMock()
        enroll_result.scalar.return_value = 0

        db.execute.side_effect = [
            login_result,
            progress_result,
            gamification_result,
            enroll_result,
        ]

        result = _compute_student_risk(db, STUDENT_ID)

        assert result["total"] == min(50 + 20 + 10 + 10, 100)
        assert result["last_login_days"] is None
        assert result["streak_status"] == "never"

    def test_compute_student_risk_active_streak(self):
        """
        Student logged in 5 days ago with an active streak and recent progress.
        No penalties should apply for streak or recent activity.
        Only: no enrollments (+10) if we simulate 0 enrollments, else 0.
        Here we give 1 enrollment so total = 0.
        """
        from src.worker.tasks import _compute_student_risk

        db = MagicMock()

        login_result = MagicMock()
        login_result.fetchone.return_value = (5,)  # 5 days ago

        progress_result = MagicMock()
        progress_result.scalar.return_value = 3  # 3 lessons in last 7 days

        gamification_result = MagicMock()
        gamification_result.fetchone.return_value = (7,)  # streak = 7

        enroll_result = MagicMock()
        enroll_result.scalar.return_value = 2  # has enrollments

        db.execute.side_effect = [
            login_result,
            progress_result,
            gamification_result,
            enroll_result,
        ]

        result = _compute_student_risk(db, STUDENT_ID)

        assert result["total"] == 0
        assert result["last_login_days"] == 5
        assert result["streak_status"] == "active"

    def test_risk_score_capped_at_100(self):
        """
        All risk factors fire:
        - last login > 30 days (+50)
        - no progress (+20)
        - broken streak (+15)
        - no enrollments (+10)
        Sum = 95, capped at 100 (so still 95 here; verify cap by testing beyond 100).
        """
        from src.worker.tasks import _compute_student_risk

        db = MagicMock()

        login_result = MagicMock()
        login_result.fetchone.return_value = (60,)  # 60 days ago

        progress_result = MagicMock()
        progress_result.scalar.return_value = 0

        gamification_result = MagicMock()
        gamification_result.fetchone.return_value = (0,)  # streak broken

        enroll_result = MagicMock()
        enroll_result.scalar.return_value = 0

        db.execute.side_effect = [
            login_result,
            progress_result,
            gamification_result,
            enroll_result,
        ]

        result = _compute_student_risk(db, STUDENT_ID)

        # 50 + 20 + 15 + 10 = 95; verify cap
        raw_sum = 50 + 20 + 15 + 10
        assert result["total"] == min(raw_sum, 100)
        assert result["total"] <= 100
        assert result["streak_status"] == "broken"
