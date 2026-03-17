"""LMS Quiz routes — Phase 11 (GP-107)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from src.api.deps_lms import get_current_lms_user
from src.api.schemas.lms_quiz import (
    QuizOptionOut,
    QuizOut,
    QuizQuestionOut,
    QuizResultOut,
    QuizSubmitRequest,
)
from src.config.database import get_async_db
from src.db.lms_models import LMSQuiz, LMSQuizAttempt, LMSQuizQuestion, LMSUser

router = APIRouter(prefix="/api/lms/quizzes", tags=["lms-quiz"])


@router.get("/{quiz_id}", response_model=QuizOut)
async def get_quiz(
    quiz_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: LMSUser = Depends(get_current_lms_user),
) -> QuizOut:
    """Return quiz with questions (answer correctness stripped)."""
    result = await db.execute(
        select(LMSQuiz)
        .options(selectinload(LMSQuiz.questions), selectinload(LMSQuiz.attempts))
        .where(LMSQuiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    questions = [
        QuizQuestionOut(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type or "multiple_choice",
            options=[QuizOptionOut(text=opt["text"]) for opt in (q.options or [])],
            order_index=q.order_index,
            points=q.points or 1,
        )
        for q in quiz.questions
    ]

    return QuizOut(
        id=quiz.id,
        title=quiz.title,
        pass_percentage=quiz.pass_percentage or 70,
        time_limit_minutes=quiz.time_limit_minutes,
        attempts_allowed=quiz.attempts_allowed or 3,
        questions=questions,
    )


@router.post("/{quiz_id}/submit", response_model=QuizResultOut)
async def submit_quiz(
    quiz_id: UUID,
    body: QuizSubmitRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: LMSUser = Depends(get_current_lms_user),
) -> QuizResultOut:
    """Grade a quiz submission and record the attempt."""
    from src.worker.tasks import handle_quiz_passed

    result = await db.execute(
        select(LMSQuiz)
        .options(selectinload(LMSQuiz.questions), selectinload(LMSQuiz.attempts))
        .where(LMSQuiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    # Check attempt limit
    student_attempts = [a for a in quiz.attempts if a.student_id == current_user.id]
    if len(student_attempts) >= (quiz.attempts_allowed or 3):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maximum number of attempts reached",
        )

    # Grade answers
    question_map = {q.id: q for q in quiz.questions}
    correct = 0
    total = len(quiz.questions)

    for question_id, selected_idx in body.answers.items():
        q = question_map.get(question_id)
        if not q or not q.options:
            continue
        opts = q.options
        if 0 <= selected_idx < len(opts) and opts[selected_idx].get("is_correct", False):
            correct += 1

    score_pct = (correct / total * 100) if total > 0 else 0.0
    passed = score_pct >= (quiz.pass_percentage or 70)

    # Record attempt
    attempt = LMSQuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id,
        answers={str(k): v for k, v in body.answers.items()},
        score_percentage=score_pct,
        passed=passed,
    )
    db.add(attempt)
    await db.commit()

    if passed:
        handle_quiz_passed.delay(
            {
                "student_id": str(current_user.id),
                "quiz_id": str(quiz_id),
                "score_percentage": score_pct,
            }
        )

    return QuizResultOut(
        quiz_id=quiz_id,
        score_percentage=score_pct,
        passed=passed,
        correct_count=correct,
        total_questions=total,
    )


# ---------------------------------------------------------------------------
# AI Explanation endpoint (C4)
# ---------------------------------------------------------------------------

_EXPLANATION_ROUTER_PREFIX = "/api/lms/quiz/questions"

explanation_router = APIRouter(prefix=_EXPLANATION_ROUTER_PREFIX, tags=["lms-quiz"])


@explanation_router.get("/{question_id}/explanation")
async def get_question_explanation(
    question_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: LMSUser = Depends(get_current_lms_user),
) -> dict:
    """
    Return (or generate and cache) an AI explanation for a quiz question.

    The explanation is generated once and stored in ai_explanation (JSONB).
    Subsequent calls return the cached value instantly.
    """
    from src.services.quiz_explanation_service import generate_quiz_explanation

    result = await db.execute(
        select(LMSQuizQuestion).where(LMSQuizQuestion.id == question_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # Return cached explanation if present
    if question.ai_explanation is not None:
        return {"question_id": str(question_id), "explanation": question.ai_explanation}

    # Derive readable option strings
    options: list[str] = [
        opt.get("text", "") for opt in (question.options or [])
    ]
    correct_index: int = next(
        (i for i, opt in enumerate(question.options or []) if opt.get("is_correct", False)),
        0,
    )

    # Fetch course title via quiz → lesson → module → course chain
    course_title = "CARSI Training"
    try:
        from src.db.lms_models import LMSLesson, LMSModule, LMSQuiz as Quiz_
        from sqlalchemy.orm import selectinload as sil

        quiz_result = await db.execute(
            select(Quiz_)
            .options(
                sil(Quiz_.lesson).selectinload(LMSLesson.module).selectinload(LMSModule.course)
            )
            .where(Quiz_.id == question.quiz_id)
        )
        quiz_obj = quiz_result.scalar_one_or_none()
        if quiz_obj and quiz_obj.lesson and quiz_obj.lesson.module and quiz_obj.lesson.module.course:
            course_title = quiz_obj.lesson.module.course.title or course_title
    except Exception:
        pass  # Fall back to default title

    explanation = await generate_quiz_explanation(
        question_text=question.question_text,
        options=options,
        correct_index=correct_index,
        student_answer_index=correct_index,  # Student answer unknown here — explain correct answer
        course_title=course_title,
    )

    # Cache to DB
    question.ai_explanation = explanation
    await db.commit()

    return {"question_id": str(question_id), "explanation": explanation}
