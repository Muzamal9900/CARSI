-- =============================================================================
-- CARSI Hub — Hub Content Tables
-- =============================================================================
-- Depends on: 20260317000001_carsi_foundation.sql
--   • update_updated_at_column() trigger function
--   • article_status enum ('draft', 'published', 'archived')
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. news_feed_sources — RSS source registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_feed_sources (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name                    VARCHAR(255)    NOT NULL,
    rss_url                 VARCHAR(1000)   NOT NULL UNIQUE,
    industry_categories     JSONB           NOT NULL DEFAULT '[]'::jsonb,
    fetch_interval_minutes  INTEGER         NOT NULL DEFAULT 60,
    last_fetched_at         TIMESTAMPTZ     NULL,
    is_active               BOOLEAN         NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

ALTER TABLE public.news_feed_sources ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS news_feed_sources_industry_categories_gin_idx
    ON public.news_feed_sources USING GIN (industry_categories);

CREATE TRIGGER news_feed_sources_updated_at
    BEFORE UPDATE ON public.news_feed_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 2. news_articles — FK to news_feed_sources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_articles (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id               UUID            NOT NULL REFERENCES public.news_feed_sources(id) ON DELETE CASCADE,
    guid                    VARCHAR(1000)   NOT NULL UNIQUE,
    original_title          VARCHAR(1000)   NOT NULL,
    source_url              VARCHAR(2000)   NOT NULL,
    author                  VARCHAR(255)    NULL,
    published_at            TIMESTAMPTZ     NULL,
    image_url               VARCHAR(2000)   NULL,
    ai_title                VARCHAR(1000)   NULL,
    ai_summary              TEXT            NULL,
    ai_tags                 JSONB           NOT NULL DEFAULT '[]'::jsonb,
    industry_categories     JSONB           NOT NULL DEFAULT '[]'::jsonb,
    relevance_score         VARCHAR(10)     NULL,
    is_featured             BOOLEAN         NOT NULL DEFAULT false,
    published               BOOLEAN         NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS news_articles_published_at_idx
    ON public.news_articles (published_at);

CREATE INDEX IF NOT EXISTS news_articles_published_idx
    ON public.news_articles (published);

CREATE INDEX IF NOT EXISTS news_articles_industry_categories_gin_idx
    ON public.news_articles USING GIN (industry_categories);

CREATE TRIGGER news_articles_updated_at
    BEFORE UPDATE ON public.news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 3. professionals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.professionals (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name               VARCHAR(255)    NOT NULL,
    slug                    VARCHAR(255)    NOT NULL UNIQUE,
    headline                VARCHAR(500)    NULL,
    bio                     TEXT            NULL,
    email                   VARCHAR(255)    NULL,
    phone                   VARCHAR(50)     NULL,
    website                 VARCHAR(1000)   NULL,
    linkedin_url            VARCHAR(1000)   NULL,
    avatar_url              VARCHAR(1000)   NULL,
    location_city           VARCHAR(100)    NULL,
    location_state          VARCHAR(10)     NULL,
    specialisations         JSONB           NOT NULL DEFAULT '[]'::jsonb,
    certifications          JSONB           NOT NULL DEFAULT '[]'::jsonb,
    industry_categories     JSONB           NOT NULL DEFAULT '[]'::jsonb,
    years_experience        INTEGER         NULL,
    nrpg_member             BOOLEAN         NOT NULL DEFAULT false,
    nrpg_member_id          VARCHAR(100)    NULL UNIQUE,
    published               BOOLEAN         NOT NULL DEFAULT false,
    featured                BOOLEAN         NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS professionals_slug_idx
    ON public.professionals (slug);

CREATE INDEX IF NOT EXISTS professionals_published_idx
    ON public.professionals (published);

CREATE INDEX IF NOT EXISTS professionals_industry_categories_gin_idx
    ON public.professionals USING GIN (industry_categories);

CREATE TRIGGER professionals_updated_at
    BEFORE UPDATE ON public.professionals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 4. job_listings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_listings (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title                   VARCHAR(500)    NOT NULL,
    company_name            VARCHAR(255)    NOT NULL,
    company_website         VARCHAR(1000)   NULL,
    company_logo_url        VARCHAR(1000)   NULL,
    description             TEXT            NOT NULL,
    employment_type         VARCHAR(50)     NOT NULL DEFAULT 'FULL_TIME',
    industry_categories     JSONB           NOT NULL DEFAULT '[]'::jsonb,
    location_city           VARCHAR(100)    NULL,
    location_state          VARCHAR(10)     NULL,
    location_postcode       VARCHAR(10)     NULL,
    is_remote               BOOLEAN         NOT NULL DEFAULT false,
    salary_min              INTEGER         NULL,
    salary_max              INTEGER         NULL,
    apply_url               VARCHAR(1000)   NULL,
    apply_email             VARCHAR(255)    NULL,
    submitter_name          VARCHAR(255)    NULL,
    submitter_email         VARCHAR(255)    NULL,
    submitter_phone         VARCHAR(50)     NULL,
    source                  VARCHAR(50)     NOT NULL DEFAULT 'manual',
    source_id               VARCHAR(255)    NULL,
    valid_through           TIMESTAMPTZ     NOT NULL,
    published               BOOLEAN         NOT NULL DEFAULT false,
    featured                BOOLEAN         NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS job_listings_valid_through_idx
    ON public.job_listings (valid_through);

CREATE INDEX IF NOT EXISTS job_listings_published_idx
    ON public.job_listings (published);

CREATE INDEX IF NOT EXISTS job_listings_industry_categories_gin_idx
    ON public.job_listings USING GIN (industry_categories);

CREATE TRIGGER job_listings_updated_at
    BEFORE UPDATE ON public.job_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 5. industry_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.industry_events (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title                   VARCHAR(500)    NOT NULL,
    description             TEXT            NULL,
    event_type              VARCHAR(50)     NOT NULL,
    industry_categories     JSONB           NOT NULL DEFAULT '[]'::jsonb,
    start_date              TIMESTAMPTZ     NOT NULL,
    end_date                TIMESTAMPTZ     NULL,
    location_name           VARCHAR(255)    NULL,
    location_address        TEXT            NULL,
    location_city           VARCHAR(100)    NULL,
    location_state          VARCHAR(10)     NULL,
    location_lat            VARCHAR(20)     NULL,
    location_lng            VARCHAR(20)     NULL,
    is_virtual              BOOLEAN         NOT NULL DEFAULT false,
    organiser_name          VARCHAR(255)    NULL,
    organiser_url           VARCHAR(1000)   NULL,
    event_url               VARCHAR(1000)   NULL,
    schema_event_status     VARCHAR(50)     NOT NULL DEFAULT 'EventScheduled',
    ticket_url              VARCHAR(1000)   NULL,
    is_free                 BOOLEAN         NOT NULL DEFAULT false,
    price_range             VARCHAR(100)    NULL,
    image_url               VARCHAR(1000)   NULL,
    source                  VARCHAR(50)     NOT NULL DEFAULT 'manual',
    source_id               VARCHAR(255)    NULL,
    published               BOOLEAN         NOT NULL DEFAULT false,
    featured                BOOLEAN         NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

ALTER TABLE public.industry_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS industry_events_event_type_idx
    ON public.industry_events (event_type);

CREATE INDEX IF NOT EXISTS industry_events_start_date_idx
    ON public.industry_events (start_date);

CREATE INDEX IF NOT EXISTS industry_events_published_idx
    ON public.industry_events (published);

CREATE INDEX IF NOT EXISTS industry_events_industry_categories_gin_idx
    ON public.industry_events USING GIN (industry_categories);

CREATE TRIGGER industry_events_updated_at
    BEFORE UPDATE ON public.industry_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 6. youtube_channels
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.youtube_channels (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    youtube_channel_id      VARCHAR(64)     NOT NULL UNIQUE,
    channel_url             VARCHAR(500)    NOT NULL,
    custom_url              VARCHAR(255)    NULL,
    name                    VARCHAR(255)    NOT NULL,
    description             TEXT            NULL,
    thumbnail_url           VARCHAR(1000)   NULL,
    subscriber_count        INTEGER         NULL,
    video_count             INTEGER         NULL,
    view_count              INTEGER         NULL,
    latest_upload_title     VARCHAR(500)    NULL,
    latest_upload_url       VARCHAR(500)    NULL,
    latest_upload_date      TIMESTAMPTZ     NULL,
    latest_upload_thumbnail VARCHAR(1000)   NULL,
    industry_categories     JSONB           NOT NULL DEFAULT '[]'::jsonb,
    tags                    JSONB           NOT NULL DEFAULT '[]'::jsonb,
    is_carsi_channel        BOOLEAN         NOT NULL DEFAULT false,
    published               BOOLEAN         NOT NULL DEFAULT false,
    featured                BOOLEAN         NOT NULL DEFAULT false,
    synced_at               TIMESTAMPTZ     NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS youtube_channels_youtube_channel_id_idx
    ON public.youtube_channels (youtube_channel_id);

CREATE INDEX IF NOT EXISTS youtube_channels_published_idx
    ON public.youtube_channels (published);

CREATE INDEX IF NOT EXISTS youtube_channels_industry_categories_gin_idx
    ON public.youtube_channels USING GIN (industry_categories);

CREATE TRIGGER youtube_channels_updated_at
    BEFORE UPDATE ON public.youtube_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 7. research_articles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_articles (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug                    VARCHAR(300)    NOT NULL UNIQUE,
    title                   VARCHAR(500)    NOT NULL,
    excerpt                 TEXT            NULL,
    content                 TEXT            NOT NULL,
    category                VARCHAR(100)    NULL,
    tags                    JSONB           NOT NULL DEFAULT '[]'::jsonb,
    seo_title               VARCHAR(70)     NULL,
    seo_description         VARCHAR(160)    NULL,
    canonical_url           VARCHAR(500)    NULL,
    og_image_url            VARCHAR(500)    NULL,
    faq_items               JSONB           NOT NULL DEFAULT '[]'::jsonb,
    author_nrpg_id          VARCHAR(100)    NULL,
    author_name             VARCHAR(255)    NULL,
    author_bio              TEXT            NULL,
    related_restore_assist  JSONB           NOT NULL DEFAULT '[]'::jsonb,
    status                  article_status  NOT NULL DEFAULT 'draft',
    published_at            TIMESTAMPTZ     NULL,
    view_count              INTEGER         NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

ALTER TABLE public.research_articles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS research_articles_slug_idx
    ON public.research_articles (slug);

CREATE INDEX IF NOT EXISTS research_articles_category_idx
    ON public.research_articles (category);

CREATE INDEX IF NOT EXISTS research_articles_author_nrpg_id_idx
    ON public.research_articles (author_nrpg_id);

CREATE INDEX IF NOT EXISTS research_articles_status_idx
    ON public.research_articles (status);

CREATE INDEX IF NOT EXISTS research_articles_industry_categories_gin_idx
    ON public.research_articles USING GIN (tags);

CREATE TRIGGER research_articles_updated_at
    BEFORE UPDATE ON public.research_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 8. podcast_shows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.podcast_shows (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug                    VARCHAR(255)    NOT NULL UNIQUE,
    name                    VARCHAR(500)    NOT NULL,
    host                    VARCHAR(500)    NULL,
    description             TEXT            NULL,
    rss_url                 VARCHAR(2000)   NULL,
    spotify_url             VARCHAR(2000)   NULL,
    apple_podcasts_url      VARCHAR(2000)   NULL,
    youtube_url             VARCHAR(2000)   NULL,
    amazon_music_url        VARCHAR(2000)   NULL,
    website_url             VARCHAR(2000)   NULL,
    cover_image_url         VARCHAR(2000)   NULL,
    episode_count           INTEGER         NULL,
    latest_episode_title    VARCHAR(1000)   NULL,
    latest_episode_date     TIMESTAMPTZ     NULL,
    latest_episode_url      VARCHAR(2000)   NULL,
    industry_categories     JSONB           NOT NULL DEFAULT '[]'::jsonb,
    tags                    JSONB           NOT NULL DEFAULT '[]'::jsonb,
    country                 VARCHAR(10)     NOT NULL DEFAULT 'AU',
    is_carsi_show           BOOLEAN         NOT NULL DEFAULT false,
    featured                BOOLEAN         NOT NULL DEFAULT false,
    published               BOOLEAN         NOT NULL DEFAULT false,
    rss_synced_at           TIMESTAMPTZ     NULL,
    rss_error               TEXT            NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

ALTER TABLE public.podcast_shows ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS podcast_shows_slug_idx
    ON public.podcast_shows (slug);

CREATE INDEX IF NOT EXISTS podcast_shows_published_idx
    ON public.podcast_shows (published);

CREATE INDEX IF NOT EXISTS podcast_shows_industry_categories_gin_idx
    ON public.podcast_shows USING GIN (industry_categories);

CREATE TRIGGER podcast_shows_updated_at
    BEFORE UPDATE ON public.podcast_shows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 9. podcast_episodes — FK to podcast_shows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.podcast_episodes (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id                 UUID            NOT NULL REFERENCES public.podcast_shows(id) ON DELETE CASCADE,
    guid                    VARCHAR(2000)   NOT NULL,
    title                   VARCHAR(1000)   NOT NULL,
    description             TEXT            NULL,
    episode_url             VARCHAR(2000)   NULL,
    audio_url               VARCHAR(2000)   NULL,
    image_url               VARCHAR(2000)   NULL,
    duration_seconds        INTEGER         NULL,
    episode_number          INTEGER         NULL,
    season_number           INTEGER         NULL,
    published_at            TIMESTAMPTZ     NULL,
    tags                    JSONB           NOT NULL DEFAULT '[]'::jsonb,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    UNIQUE (show_id, guid)
);

ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS podcast_episodes_show_id_idx
    ON public.podcast_episodes (show_id);
