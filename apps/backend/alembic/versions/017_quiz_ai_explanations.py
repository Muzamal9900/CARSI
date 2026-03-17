"""Phase C4: ai_explanation column on lms_quiz_questions.

Revision ID: 017
Revises: 016
Create Date: 2026-03-18
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE lms_quiz_questions ADD COLUMN IF NOT EXISTS ai_explanation JSONB"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE lms_quiz_questions DROP COLUMN IF EXISTS ai_explanation"
    )
