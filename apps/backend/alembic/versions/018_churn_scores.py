"""Phase C5: lms_student_risk_scores table for churn prediction.

Revision ID: 018
Revises: 017
Create Date: 2026-03-18
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS lms_student_risk_scores (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES lms_users(id) ON DELETE CASCADE,
            risk_score DECIMAL(5,2) NOT NULL DEFAULT 0,
            last_login_days_ago INTEGER,
            progress_velocity_score DECIMAL(5,2),
            streak_status VARCHAR(20),
            computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(student_id)
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_lms_student_risk_scores_risk "
        "ON lms_student_risk_scores(risk_score DESC)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_lms_student_risk_scores_computed "
        "ON lms_student_risk_scores(computed_at)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS lms_student_risk_scores")
