"""Phase C1: course search indexes — pgvector extension + GIN full-text index.

Revision ID: 016
Revises: 015
Create Date: 2026-03-18
"""

from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def _extension_available(name: str) -> bool:
    """Check if a PostgreSQL extension is available on the server."""
    conn = op.get_bind()
    result = conn.execute(
        text("SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = :n)"),
        {"n": name},
    )
    return result.scalar()


def upgrade() -> None:
    # pgvector: only install if available on the server (not present on Fly unmanaged Postgres)
    if _extension_available("vector"):
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")
        op.execute(
            "ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS embedding vector(1536)"
        )
        op.execute(
            """
            CREATE INDEX IF NOT EXISTS ix_lms_courses_embedding
            ON lms_courses USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
            """
        )

    # GIN inverted index for full-text search — makes tsvector @@ tsquery O(log n)
    # This works on all PostgreSQL servers (no extension needed)
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_lms_courses_search
        ON lms_courses
        USING GIN (
            to_tsvector(
                'english',
                coalesce(title, '') || ' ' ||
                coalesce(description, '') || ' ' ||
                coalesce(iicrc_discipline, '')
            )
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_lms_courses_search")
    op.execute("DROP INDEX IF EXISTS ix_lms_courses_embedding")
    op.execute("ALTER TABLE lms_courses DROP COLUMN IF EXISTS embedding")
    # Note: we do NOT drop the vector extension — other tables may use it
