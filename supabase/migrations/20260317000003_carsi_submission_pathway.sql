-- CARSI Hub — Submission Pathway (Podcasters, YouTubers, SMB owners)
-- Migration: 20260317000003
-- Creates the intake queue, CMS-managed guidelines, and email audit trail
-- for all content submission types flowing through CARSI review before publication.

-- ============================================================
-- 1. hub_submissions — Master intake queue
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_submissions (
    id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Submission classification
    submission_type           VARCHAR(50)   NOT NULL,
    status                    submission_status NOT NULL DEFAULT 'pending',

    -- Submitter identity
    submitter_name            VARCHAR(255)  NOT NULL,
    submitter_email           VARCHAR(255)  NOT NULL,
    submitter_phone           VARCHAR(50)   NULL,
    submitter_company         VARCHAR(255)  NULL,
    submitter_role            VARCHAR(255)  NULL,   -- e.g. "Business Owner", "Podcast Host"

    -- What they are submitting
    submission_title          VARCHAR(500)  NOT NULL,
    submission_url            VARCHAR(2000) NULL,
    submission_description    TEXT          NULL,
    submission_data           JSONB         NOT NULL DEFAULT '{}',  -- type-specific extra fields

    -- Review fields (internal)
    reviewed_by               VARCHAR(255)  NULL,
    reviewed_at               TIMESTAMPTZ   NULL,
    review_notes              TEXT          NULL,    -- internal only, not shown to submitter
    rejection_reason          TEXT          NULL,    -- shown to submitter if rejected
    needs_info_message        TEXT          NULL,    -- shown to submitter if needs_info

    -- Linked records (populated when approved and published record created)
    linked_podcast_show_id    UUID          NULL REFERENCES public.podcast_shows(id)     ON DELETE SET NULL,
    linked_youtube_channel_id UUID          NULL,
    linked_professional_id    UUID          NULL REFERENCES public.professionals(id)     ON DELETE SET NULL,
    linked_event_id           UUID          NULL REFERENCES public.industry_events(id)   ON DELETE SET NULL,
    linked_job_id             UUID          NULL REFERENCES public.job_listings(id)      ON DELETE SET NULL,

    -- Spam prevention / audit
    ip_address                VARCHAR(45)   NULL,
    user_agent                TEXT          NULL,
    terms_accepted            BOOLEAN       NOT NULL DEFAULT false,
    guidelines_accepted       BOOLEAN       NOT NULL DEFAULT false,

    created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT hub_submissions_type_check CHECK (
        submission_type IN ('podcast', 'youtube_channel', 'professional', 'event', 'job', 'article', 'news_source')
    )
);

-- ============================================================
-- 2. submission_guidelines — CMS-managed guidelines per type
-- ============================================================

CREATE TABLE IF NOT EXISTS public.submission_guidelines (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    submission_type      VARCHAR(50)   NOT NULL UNIQUE,
    title                VARCHAR(255)  NOT NULL,
    intro_text           TEXT          NOT NULL,

    -- JSONB arrays: guidelines = [{heading, body}], eligibility_criteria = [string]
    guidelines           JSONB         NOT NULL DEFAULT '[]',
    eligibility_criteria JSONB         NOT NULL DEFAULT '[]',

    review_timeframe     VARCHAR(100)  NULL DEFAULT '3–5 business days',
    is_active            BOOLEAN       NOT NULL DEFAULT true,
    updated_by           VARCHAR(255)  NULL,

    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT submission_guidelines_type_check CHECK (
        submission_type IN ('podcast', 'youtube_channel', 'professional', 'event', 'job', 'article', 'news_source')
    )
);

-- ============================================================
-- 3. submission_email_log — Audit trail of emails sent to submitters
-- ============================================================

CREATE TABLE IF NOT EXISTS public.submission_email_log (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    submission_id    UUID          NOT NULL REFERENCES public.hub_submissions(id) ON DELETE CASCADE,
    email_type       VARCHAR(50)   NOT NULL,   -- 'received_confirmation' | 'under_review' | 'approved' | 'rejected' | 'needs_info'
    recipient_email  VARCHAR(255)  NOT NULL,
    sent_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    delivery_status  VARCHAR(50)   NULL DEFAULT 'sent',   -- 'sent' | 'delivered' | 'failed'
    error_message    TEXT          NULL,

    CONSTRAINT submission_email_log_type_check CHECK (
        email_type IN ('received_confirmation', 'under_review', 'approved', 'rejected', 'needs_info')
    ),
    CONSTRAINT submission_email_log_status_check CHECK (
        delivery_status IN ('sent', 'delivered', 'failed')
    )
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS hub_submissions_status_idx
    ON public.hub_submissions (status);

CREATE INDEX IF NOT EXISTS hub_submissions_submitter_email_idx
    ON public.hub_submissions (submitter_email);

CREATE INDEX IF NOT EXISTS hub_submissions_type_status_idx
    ON public.hub_submissions (submission_type, status);

CREATE INDEX IF NOT EXISTS hub_submissions_created_at_idx
    ON public.hub_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS submission_email_log_submission_id_idx
    ON public.submission_email_log (submission_id);

CREATE INDEX IF NOT EXISTS submission_email_log_sent_at_idx
    ON public.submission_email_log (sent_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.hub_submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_email_log  ENABLE ROW LEVEL SECURITY;

-- submission_guidelines: public read (forms need to display them), admin write
CREATE POLICY "submission_guidelines_public_read"
    ON public.submission_guidelines FOR SELECT
    USING (is_active = true);

CREATE POLICY "submission_guidelines_admin_all"
    ON public.submission_guidelines FOR ALL
    USING (auth.role() = 'service_role');

-- hub_submissions: anyone can insert (public form), service_role can read/update
CREATE POLICY "hub_submissions_public_insert"
    ON public.hub_submissions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "hub_submissions_admin_all"
    ON public.hub_submissions FOR ALL
    USING (auth.role() = 'service_role');

-- submission_email_log: service_role only
CREATE POLICY "submission_email_log_admin_all"
    ON public.submission_email_log FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================
-- updated_at triggers
-- ============================================================

CREATE TRIGGER hub_submissions_updated_at
    BEFORE UPDATE ON public.hub_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER submission_guidelines_updated_at
    BEFORE UPDATE ON public.submission_guidelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed: submission_guidelines (7 types, Australian market)
-- ============================================================

INSERT INTO public.submission_guidelines
    (submission_type, title, intro_text, guidelines, eligibility_criteria, review_timeframe)
VALUES

-- 1. podcast
(
    'podcast',
    'Submit Your Podcast',
    'CARSI Hub features podcasts that serve Australian restoration, HVAC, cleaning, and allied trade professionals. Before submitting, please review the eligibility criteria below. All submissions are manually reviewed by the CARSI team to maintain the quality and relevance of our directory.',
    '[
        {"heading": "Content quality", "body": "Your podcast must deliver educational, informational, or professional development value to the Australian trades industry. Entertainment-only or purely self-promotional content will not be listed."},
        {"heading": "Professional tone", "body": "Episodes should be produced to a reasonable standard — clear audio, accurate information, and respectful guest treatment. We do not require professional studio production, but basic audio quality is expected."},
        {"heading": "No spam or advertorial channels", "body": "Channels that exist solely to promote a single product, brand, or service will not be listed. Sponsored episodes are fine as long as independent editorial content forms the majority of the show."},
        {"heading": "Accurate information", "body": "Any technical, regulatory, or certification claims made in your podcast must be accurate and current. CARSI reserves the right to remove listings where misinformation is identified."}
    ]'::jsonb,
    '[
        "Must cover restoration, HVAC, cleaning, pest control, or related building services industries",
        "Must be actively producing episodes — at least 1 episode published in the last 6 months",
        "Must be primarily Australia/NZ focused or directly relevant to Australian trade professionals",
        "Must have a publicly accessible RSS feed or listing on a major podcast platform"
    ]'::jsonb,
    '3–5 business days'
),

-- 2. youtube_channel
(
    'youtube_channel',
    'Submit Your YouTube Channel',
    'CARSI Hub lists YouTube channels that provide genuine educational or technical value to Australian restoration, HVAC, flooring, cleaning, and allied trade professionals. Submit your channel for review below.',
    '[
        {"heading": "Educational content preferred", "body": "Channels should primarily feature how-to guides, technical demonstrations, product reviews, training content, or industry news. Content that teaches tradies something useful is what we are looking for."},
        {"heading": "No purely commercial channels", "body": "Channels that only post promotional videos, advertisements, or branded content without independent educational value will not be listed. Channels can be brand-owned, but most content must be genuinely useful to viewers."},
        {"heading": "Active upload schedule", "body": "Your channel should show a pattern of regular uploads. Inactive channels (no new content in over 12 months) will not be listed and may be removed from existing listings."},
        {"heading": "Accurate technical claims", "body": "Technical demonstrations and product comparisons must be accurate and not mislead viewers about product capabilities, standards compliance, or regulatory requirements."}
    ]'::jsonb,
    '[
        "Content must be relevant to restoration, HVAC, flooring, pest control, cleaning, or indoor air quality (IAQ)",
        "Minimum 5 published videos",
        "Channel must show a regular upload schedule",
        "Must be publicly accessible (not private or members-only)"
    ]'::jsonb,
    '3–5 business days'
),

-- 3. professional
(
    'professional',
    'List Your Professional Profile',
    'Get your professional profile listed in the CARSI Hub directory and connect with thousands of Australian industry professionals. All listings are manually verified to ensure the directory remains accurate and trustworthy.',
    '[
        {"heading": "Accurate credentials only", "body": "Only list certifications, licences, and qualifications you currently hold and that are valid. Do not list lapsed, expired, or in-progress credentials as current. CARSI may contact your certifying body to verify claims."},
        {"heading": "No unverified IICRC claims", "body": "IICRC certifications (WRT, CRT, ASD, OCT, CCT, etc.) must be current and verifiable via the IICRC registry. Listing lapsed IICRC credentials is a violation of IICRC rules and CARSI listing terms."},
        {"heading": "ABN required for business listings", "body": "If you are listing as a business rather than an individual, your ABN must be provided and active. ABN details are verified against the ABR."},
        {"heading": "One listing per professional or business", "body": "Duplicate listings for the same individual or business entity will be merged or removed. If you need to update an existing listing, contact the CARSI team."}
    ]'::jsonb,
    '[
        "Must be an active Australian trade professional in restoration, HVAC, cleaning, flooring, pest control, or IAQ",
        "Must hold at least one relevant industry certification, registration, or state-issued trade licence",
        "ABN required for any business listing",
        "Must be operating within Australia"
    ]'::jsonb,
    '5–7 business days'
),

-- 4. event
(
    'event',
    'Submit an Industry Event',
    'Promote your training course, conference, webinar, or workshop to thousands of Australian trade professionals through CARSI Hub. Events are reviewed and published quickly — typically within 2–3 business days.',
    '[
        {"heading": "Accurate dates and location", "body": "Provide precise event dates, start times (AEST/AEDT), and the venue address or online platform. Incorrect information reflects poorly on your organisation and will result in your listing being removed."},
        {"heading": "Provide the official event URL", "body": "All event listings must link to the official registration page or event website. Social media posts or informal pages are not accepted as primary event URLs."},
        {"heading": "Open to industry professionals", "body": "Events must be open for registration by general industry professionals. Private corporate events or invitation-only gatherings will not be listed."},
        {"heading": "Timely removal", "body": "CARSI will automatically archive events after their end date. If your event is postponed or cancelled, please notify CARSI promptly so the listing can be updated."}
    ]'::jsonb,
    '[
        "Event must be relevant to Australian building restoration, cleaning, HVAC, or allied trades",
        "Training courses, conferences, webinars, and workshops are all welcome",
        "Must be publicly open to industry professionals",
        "Event must have a confirmed date and registration pathway"
    ]'::jsonb,
    '2–3 business days'
),

-- 5. job
(
    'job',
    'Post a Job Listing',
    'Reach qualified Australian trade professionals with a job listing on CARSI Hub. Listings are reviewed within 1–2 business days and remain active for 30 days unless renewed.',
    '[
        {"heading": "Clear role description and requirements", "body": "Your listing must clearly state the role title, responsibilities, required qualifications or licences, location, and employment type (full-time, part-time, contract, casual). Vague listings will be returned for revision."},
        {"heading": "No illegal or discriminatory language", "body": "Job listings must comply with Australian anti-discrimination law. Do not include requirements based on age, gender, ethnicity, religion, or other protected attributes unless a genuine occupational requirement exists and can be legally justified."},
        {"heading": "Authorised posting only", "body": "Listings must be posted by the employer directly or by a recruitment agency with written authority from the employer. Scraping or reposting jobs from other platforms without permission is not permitted."},
        {"heading": "30-day expiry", "body": "All job listings expire after 30 days. You will receive an email reminder before expiry with the option to renew. Expired listings will not be visible to job seekers."}
    ]'::jsonb,
    '[
        "Must be a genuine employment opportunity in restoration, HVAC, cleaning, flooring, pest control, or allied trades",
        "Australian positions only — remote roles must be open to Australian residents",
        "Must be posted by the employer or an authorised recruiter",
        "Salary range or rate strongly recommended (listings without compensation guidance may be deprioritised)"
    ]'::jsonb,
    '1–2 business days'
),

-- 6. article
(
    'article',
    'Submit a Research Article',
    'CARSI Hub publishes original, evidence-based articles from qualified Australian industry professionals and researchers. Articles must meet editorial standards before publication. This is not a guest post service — submissions are reviewed for scientific rigour and practical relevance.',
    '[
        {"heading": "No product promotion disguised as editorial", "body": "Articles must be genuinely informational or educational. Content that primarily promotes a product, service, or brand — even if written in an editorial style — will be rejected. Disclosure of any commercial interest is mandatory."},
        {"heading": "Citations required for scientific claims", "body": "Any claim referencing scientific studies, standards bodies (IICRC, AIHA, AS/NZS), or statistical data must include a citation. Uncited technical claims are grounds for rejection or editorial revision."},
        {"heading": "Editorial review and possible editing", "body": "Accepted articles may be lightly edited for clarity, grammar, and CARSI style guidelines. Substantive content changes will always be approved with the author. By submitting, you agree to CARSI editorial review."},
        {"heading": "Minimum length and depth", "body": "Articles must be at least 800 words and cover a topic in sufficient depth to be genuinely useful to a practising professional. Short promotional pieces or thin content will not be accepted."}
    ]'::jsonb,
    '[
        "Original content — must not be published elsewhere (including your own blog) prior to CARSI publication",
        "Must be authored by a qualified industry professional, researcher, or subject matter expert",
        "Must be relevant to Australian restoration, HVAC, cleaning, or allied trades",
        "Minimum 800 words, evidence-based, with citations where applicable"
    ]'::jsonb,
    '5–10 business days'
),

-- 7. news_source
(
    'news_source',
    'Suggest a News Source',
    'Help CARSI Hub stay current by suggesting an industry publication, association newsletter, or research body that produces relevant trade news for Australian professionals. Approved sources are added to our automated news feed.',
    '[
        {"heading": "No purely commercial feeds", "body": "News sources must produce independent editorial content — not press releases, product announcements, or vendor marketing. Commercial publishers are welcome if the majority of content is independent editorial."},
        {"heading": "Valid RSS feed required", "body": "Sources must have a functioning RSS or Atom feed URL. CARSI uses RSS to automatically pull headlines. Sources without an RSS feed cannot be added to the automated feed."},
        {"heading": "Minimum publication frequency", "body": "Sources must publish new content at least once per month. Infrequently updated or dormant publications will not be listed, and existing listings will be removed if a source becomes inactive."},
        {"heading": "Content relevance", "body": "The majority of content from the source should be relevant to Australian restoration, HVAC, cleaning, flooring, pest control, IAQ, or property services industries. Broad property or construction news may be considered if industry-specific coverage is strong."}
    ]'::jsonb,
    '[
        "Must be an industry publication, association newsletter, or research body",
        "Must publish content relevant to the Australian restoration, HVAC, cleaning, or allied trades market",
        "Must have a valid, publicly accessible RSS or Atom feed",
        "Must produce new content at least monthly"
    ]'::jsonb,
    '3–5 business days'
)

ON CONFLICT (submission_type) DO UPDATE SET
    title                = EXCLUDED.title,
    intro_text           = EXCLUDED.intro_text,
    guidelines           = EXCLUDED.guidelines,
    eligibility_criteria = EXCLUDED.eligibility_criteria,
    review_timeframe     = EXCLUDED.review_timeframe,
    updated_at           = now();
