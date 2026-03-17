"""
013 — Add tier column to lms_courses

Supports the 3-tier membership model:
  free       — accessible to all (no subscription required)
  foundation — requires Foundation ($44/mo) or Growth ($99/mo)
  growth     — requires Growth ($99/mo) only

Default: 'foundation' — existing courses retain Foundation-level access.

Revision ID: 013
Revises: 012
"""

import sqlalchemy as sa
from alembic import op

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "lms_courses",
        sa.Column(
            "tier",
            sa.String(50),
            nullable=False,
            server_default="foundation",
        ),
    )


def downgrade() -> None:
    op.drop_column("lms_courses", "tier")
