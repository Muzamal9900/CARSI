"""Add password reset token columns to lms_users.

Revision ID: 023
Revises: 022
Create Date: 2026-03-18

Adds:
- password_reset_token: sha256-hashed reset token (nullable)
- password_reset_expires: UTC expiry timestamp (nullable)
"""

from alembic import op
import sqlalchemy as sa

revision = "023"
down_revision = "022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "lms_users",
        sa.Column("password_reset_token", sa.String(64), nullable=True),
    )
    op.add_column(
        "lms_users",
        sa.Column("password_reset_expires", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_lms_users_password_reset_token",
        "lms_users",
        ["password_reset_token"],
    )


def downgrade() -> None:
    op.drop_index("ix_lms_users_password_reset_token", table_name="lms_users")
    op.drop_column("lms_users", "password_reset_expires")
    op.drop_column("lms_users", "password_reset_token")
