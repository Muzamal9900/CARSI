"""Learning pathways, categories, course prerequisites, migration jobs

Revision ID: 002
Revises: 001
Create Date: 2026-03-03
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # Category Taxonomy                                                    #
    # ------------------------------------------------------------------ #
    op.create_table(
        "lms_categories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("parent_id", UUID(as_uuid=True), sa.ForeignKey("lms_categories.id", ondelete="SET NULL")),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ------------------------------------------------------------------ #
    # Learning Pathways (Certification Journeys)                          #
    # ------------------------------------------------------------------ #
    op.create_table(
        "lms_learning_pathways",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("slug", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("iicrc_discipline", sa.String(10)),       # WRT|CRT|OCT|ASD|CCT
        sa.Column("target_certification", sa.String(100)),
        sa.Column("estimated_hours", sa.Numeric(5, 1)),
        sa.Column("is_published", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ------------------------------------------------------------------ #
    # Pathway–Course Junction                                             #
    # ------------------------------------------------------------------ #
    op.create_table(
        "lms_learning_pathway_courses",
        sa.Column("pathway_id", UUID(as_uuid=True), sa.ForeignKey("lms_learning_pathways.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", UUID(as_uuid=True), sa.ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("pathway_id", "course_id"),
    )

    # ------------------------------------------------------------------ #
    # Course Prerequisites                                                 #
    # ------------------------------------------------------------------ #
    op.create_table(
        "lms_course_prerequisites",
        sa.Column("course_id", UUID(as_uuid=True), sa.ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("prerequisite_course_id", UUID(as_uuid=True), sa.ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_strict", sa.Boolean(), server_default=sa.text("false")),
        sa.PrimaryKeyConstraint("course_id", "prerequisite_course_id"),
    )

    # ------------------------------------------------------------------ #
    # Migration Jobs (content pipeline tracking)                          #
    # ------------------------------------------------------------------ #
    op.create_table(
        "lms_migration_jobs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("job_type", sa.String(50), nullable=False),       # discover|extract|enrich|validate|load
        sa.Column("status", sa.String(50), server_default="pending"),   # pending|running|completed|failed
        sa.Column("total_items", sa.Integer()),
        sa.Column("processed_items", sa.Integer(), server_default="0"),
        sa.Column("failed_items", sa.Integer(), server_default="0"),
        sa.Column("result_manifest", JSONB(), server_default="[]"),     # discovered items
        sa.Column("error_log", JSONB(), server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ------------------------------------------------------------------ #
    # New columns on lms_courses                                          #
    # ------------------------------------------------------------------ #
    op.add_column("lms_courses", sa.Column("difficulty", sa.String(50)))
    op.add_column("lms_courses", sa.Column("estimated_duration_hours", sa.Numeric(5, 1)))
    op.add_column("lms_courses", sa.Column("category_id", UUID(as_uuid=True), sa.ForeignKey("lms_categories.id", ondelete="SET NULL")))
    op.add_column("lms_courses", sa.Column("learning_objectives", JSONB(), server_default="[]"))
    op.add_column("lms_courses", sa.Column("migration_source", sa.String(50)))   # google_drive|manual|import


def downgrade() -> None:
    # Drop new course columns first
    op.drop_column("lms_courses", "migration_source")
    op.drop_column("lms_courses", "learning_objectives")
    op.drop_column("lms_courses", "category_id")
    op.drop_column("lms_courses", "estimated_duration_hours")
    op.drop_column("lms_courses", "difficulty")

    # Drop tables in reverse dependency order
    op.drop_table("lms_migration_jobs")
    op.drop_table("lms_course_prerequisites")
    op.drop_table("lms_learning_pathway_courses")
    op.drop_table("lms_learning_pathways")
    op.drop_table("lms_categories")
