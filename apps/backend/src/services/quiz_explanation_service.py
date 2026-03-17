"""AI-generated quiz explanations — Phase C4."""

import json
import os
from datetime import UTC, datetime

from anthropic import Anthropic

_client: Anthropic | None = None


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
    return _client


async def generate_quiz_explanation(
    question_text: str,
    options: list[str],
    correct_index: int,
    student_answer_index: int,
    course_title: str,
) -> dict:
    """
    Generate an AI explanation for a quiz question.

    Returns a dict with keys: correct_answer, explanation, study_tip, generated_at.
    Falls back gracefully if the Anthropic API is unavailable or the key is absent.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return _fallback_explanation(options, correct_index)

    correct_option = options[correct_index] if correct_index < len(options) else "Unknown"
    wrong_option = (
        options[student_answer_index] if student_answer_index < len(options) else "Unknown"
    )

    prompt = f"""You are a training instructor for the course "{course_title}".

A student answered a quiz question incorrectly. Explain why the correct answer is right and help them understand.

Question: {question_text}

Student answered: {wrong_option}
Correct answer: {correct_option}

Provide a JSON response with exactly these keys:
- "explanation": 2-3 sentences explaining why the correct answer is right (be specific and educational)
- "study_tip": 1 sentence on what concept to review before retrying

JSON only, no other text."""

    try:
        client = _get_client()
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)
        data["correct_answer"] = correct_option
        data["generated_at"] = datetime.now(UTC).isoformat()
        return data
    except Exception:
        return _fallback_explanation(options, correct_index)


def _fallback_explanation(options: list[str], correct_index: int) -> dict:
    correct = options[correct_index] if correct_index < len(options) else "See course material"
    return {
        "correct_answer": correct,
        "explanation": (
            f"The correct answer is: {correct}. "
            "Review the relevant lesson content for a full explanation."
        ),
        "study_tip": "Re-read the lesson material before retrying the quiz.",
        "generated_at": datetime.now(UTC).isoformat(),
    }
