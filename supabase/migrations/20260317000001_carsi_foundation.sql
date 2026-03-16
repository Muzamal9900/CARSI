-- =============================================================================
-- CARSI Hub — Foundation: Extensions + Utility Functions
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fast text search on titles
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- accent-insensitive search

-- ---------------------------------------------------------------------------
-- update_updated_at_column — standard trigger for all tables
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- article_status enum (used by research_articles)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- submission_status enum (used by all submission tables)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM (
        'pending',
        'under_review',
        'approved',
        'rejected',
        'needs_info'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
