"""CARSI LMS — Next Course Recommendation Engine — Phase C3.

Endpoint: GET /api/lms/recommendations/next-course
Auth:      Required (student calls this from their dashboard)

Scoring algorithm (pure SQL, no ML):
  +3  same discipline as a completed course
  +2  discipline is in the affinity list for a completed discipline
  +1  per prior enrolment in that discipline (beyond the first)
  enrollment_count used as tiebreaker

Results are capped at 5, already-enrolled courses are excluded.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps_lms import get_current_lms_user
from src.config.database import get_async_db
from src.db.lms_models import LMSUser

router = APIRouter(prefix="/api/lms", tags=["LMS Recommendations"])

# ---------------------------------------------------------------------------
# Discipline affinity map
# ---------------------------------------------------------------------------

DISCIPLINE_AFFINITY: dict[str, list[str]] = {
    "WRT": ["ASD", "CRT", "OCT"],
    "ASD": ["WRT", "OCT"],
    "CRT": ["WRT", "CCT", "OCT"],
    "OCT": ["WRT", "ASD", "CRT"],
    "CCT": ["CRT"],
    "FCT": ["WRT", "CRT"],
    "HST": ["WRT", "ASD"],
}


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------


class RecommendedCourse(BaseModel):
    """A single recommended course with a human-readable reason."""

    id: str
    title: str
    slug: str
    description: str | None
    iicrc_discipline: str | None
    cec_hours: float | None
    thumbnail_url: str | None
    reason: str  # e.g. "Continue your WRT pathway"

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_reason(discipline: str | None, completed_disciplines: list[str], affinity_disciplines: list[str]) -> str:
    """Return a human-readable reason string for a recommendation."""
    if discipline and discipline in completed_disciplines:
        return f"Continue your {discipline} pathway"
    if discipline and discipline in affinity_disciplines:
        return "Learners like you also took this"
    return "Popular in your industry"


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------


@router.get("/recommendations/next-course", response_model=list[RecommendedCourse])
async def get_next_course_recommendations(
    current_user: LMSUser = Depends(get_current_lms_user),
    db: AsyncSession = Depends(get_async_db),
) -> list[RecommendedCourse]:
    """Return up to 5 personalised course recommendations for the current student.

    Algorithm:
    1. Fetch student's enrolment history (all statuses) to exclude enrolled courses.
    2. Fetch disciplines from **completed** enrolments for scoring.
    3. Build affinity discipline list from DISCIPLINE_AFFINITY map.
    4. Score candidate published courses:
       - +3 per completed course in the same discipline
       - +2 if the discipline is in the student's affinity list
       - enrollment_count (popularity) as final tiebreaker
    5. Sort descending and return top 5.
    """
    student_id = str(current_user.id)

    # --- Step 1: all enrolled course IDs (exclude from candidates) ----------
    enrolled_sql = text(
        """
        SELECT course_id::text
        FROM   lms_enrollments
        WHERE  student_id = :student_id
        """
    )
    enrolled_result = await db.execute(enrolled_sql, {"student_id": student_id})
    enrolled_ids: list[str] = [row[0] for row in enrolled_result.fetchall()]

    # --- Step 2: disciplines from completed courses only --------------------
    completed_sql = text(
        """
        SELECT DISTINCT c.iicrc_discipline
        FROM   lms_enrollments e
        JOIN   lms_courses c ON c.id = e.course_id
        WHERE  e.student_id  = :student_id
          AND  e.status       = 'completed'
          AND  c.iicrc_discipline IS NOT NULL
        """
    )
    completed_result = await db.execute(completed_sql, {"student_id": student_id})
    completed_disciplines: list[str] = [row[0] for row in completed_result.fetchall() if row[0]]

    # Build flat list of affinity disciplines (union of all related disciplines)
    affinity_disciplines: list[str] = []
    for disc in completed_disciplines:
        for related in DISCIPLINE_AFFINITY.get(disc, []):
            if related not in affinity_disciplines and related not in completed_disciplines:
                affinity_disciplines.append(related)

    # --- Step 3: candidate courses (published, not enrolled) ----------------
    # Build exclusion list — use a placeholder if empty to keep SQL valid.
    exclusion_ids = enrolled_ids if enrolled_ids else ["00000000-0000-0000-0000-000000000000"]

    # PostgreSQL array literal for IN clause via text() binding
    candidates_sql = text(
        """
        SELECT
            c.id::text,
            c.title,
            c.slug,
            c.description,
            c.iicrc_discipline,
            c.cec_hours,
            c.thumbnail_url,
            (
                SELECT COUNT(*)
                FROM   lms_enrollments e2
                WHERE  e2.course_id = c.id
            ) AS enrollment_count
        FROM  lms_courses c
        WHERE c.status = 'published'
          AND c.id::text != ALL(:exclusion_ids)
        ORDER BY enrollment_count DESC
        """
    )
    candidates_result = await db.execute(candidates_sql, {"exclusion_ids": exclusion_ids})
    candidates = candidates_result.fetchall()

    # --- Step 4: score each candidate ---------------------------------------
    scored: list[tuple[float, int, dict]] = []

    for row in candidates:
        discipline = row.iicrc_discipline
        score: float = 0.0

        if discipline:
            if discipline in completed_disciplines:
                score += 3.0
            elif discipline in affinity_disciplines:
                score += 2.0

        enrollment_count = int(row.enrollment_count) if row.enrollment_count else 0

        reason = _build_reason(discipline, completed_disciplines, affinity_disciplines)

        scored.append((
            score,
            enrollment_count,
            {
                "id": row.id,
                "title": row.title,
                "slug": row.slug,
                "description": row.description,
                "iicrc_discipline": discipline,
                "cec_hours": float(row.cec_hours) if row.cec_hours is not None else None,
                "thumbnail_url": row.thumbnail_url,
                "reason": reason,
            },
        ))

    # Sort: primary score DESC, tiebreaker enrollment_count DESC
    scored.sort(key=lambda t: (t[0], t[1]), reverse=True)

    return [RecommendedCourse(**item[2]) for item in scored[:5]]
