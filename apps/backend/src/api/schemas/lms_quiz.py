"""Pydantic schemas for LMS Quiz endpoints."""

from uuid import UUID

from pydantic import BaseModel


class QuizOptionOut(BaseModel):
    """Quiz answer option — is_correct is omitted for student-facing responses."""

    text: str


class QuizQuestionOut(BaseModel):
    id: UUID
    question_text: str
    question_type: str
    options: list[QuizOptionOut]
    order_index: int
    points: int


class QuizOut(BaseModel):
    id: UUID
    title: str
    pass_percentage: int
    time_limit_minutes: int | None
    attempts_allowed: int
    questions: list[QuizQuestionOut]


class QuizSubmitRequest(BaseModel):
    """Map of question_id → selected option index (0-based)."""

    answers: dict[UUID, int]


class QuizResultOut(BaseModel):
    quiz_id: UUID
    score_percentage: float
    passed: bool
    correct_count: int
    total_questions: int
