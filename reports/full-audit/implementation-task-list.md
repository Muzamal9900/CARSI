# Implementation Task List — CARSI LMS

**Generated:** 06/03/2026
**Directive:** Post-Install Full Audit Cycle — Phase 5

---

## Architecture

### ARCH-001: Rename package to carsi-lms

**Priority:** P3
**Description:** Update root `package.json` `"name"` field from `claude-agent-orchestration-template` to `carsi-lms`.
**Dependencies:** None
**Evidence to complete:** `cat package.json | grep '"name"'` returns `"carsi-lms"`

---

### ARCH-002: Remove starter template artefacts from production build

**Priority:** P2
**Description:** Remove or redirect pages that belong to the NodeJS-Starter-V1 template and have no place in CARSI LMS. Pages to remove: `/demo`, `/demo-live`, `/council-demo`, `/design-system`, `/status-demo`, `/prd/[id]`, `/prd/generate`, `/dashboard/agent-runs`, `dashboard-analytics`, `workflows/*`.
**Dependencies:** None
**Evidence to complete:** Navigating to any removed route returns 404 or redirects to `/courses`

---

### ARCH-003: Audit cross-layer imports in frontend

**Priority:** P2
**Description:** Verify no components import directly from API layers, and no server-side code leaks into client components. Search: `rg "from.*api.*" apps/web/app --include="*.tsx" -l`
**Dependencies:** None
**Evidence to complete:** 0 cross-layer violations found

---

## Frontend / UI

### FE-001: Build `/student/credentials` page (credential wallet)

**Priority:** P0 — CRITICAL
**Description:** The student credential wallet page was documented as complete in Phase 18 (MEMORY.md) but the file `apps/web/app/(dashboard)/student/credentials/page.tsx` does not exist. Backend `lms_credentials.py` is complete. Build the page using `GET /api/lms/credentials/my-credentials`. Display: credential card, issue date, CECs, LinkedIn share button, download certificate button.
**Dependencies:** Backend at `GET /api/lms/credentials/my-credentials`
**Evidence to complete:** Student can navigate to `/student/credentials`, see their credential list, and click LinkedIn share

---

### FE-002: Build `/student/notes` page (per-lesson notes view)

**Priority:** P1
**Description:** Per-lesson notes backend (`lms_notes.py`) is complete but the student notes overview page does not exist. Build `apps/web/app/(dashboard)/student/notes/page.tsx`. Display: all notes grouped by course/lesson, with edit/delete. Use `GET /api/lms/notes/my-notes`.
**Dependencies:** Backend at `GET /api/lms/notes/my-notes`
**Evidence to complete:** Student can view, edit, and delete notes at `/student/notes`

---

### FE-003: Add rate-limit feedback UI for auth

**Priority:** P1
**Description:** When backend adds rate limiting (BACK-003), the frontend login form needs to display a meaningful error when a 429 is returned. Current error handling may show a generic error. Update `apps/web/app/(auth)/login/page.tsx` to show "Too many attempts. Please wait 60 seconds."
**Dependencies:** BACK-003 (rate limiting)
**Evidence to complete:** After 5 failed logins, user sees the rate limit message

---

### FE-004: Add Terms of Service and Privacy Policy pages

**Priority:** P1 (required for Stripe/legal compliance)
**Description:** Create `apps/web/app/(public)/terms/page.tsx` and `apps/web/app/(public)/privacy/page.tsx`. Content should cover: user obligations, subscription terms, IICRC certification disclaimer, data handling (Australian Privacy Act), refund policy.
**Dependencies:** None (content from Phil)
**Evidence to complete:** Both pages load, are linked from footer, and pass spell-check

---

### FE-005: Design system compliance audit and remediation

**Priority:** P2
**Description:** Run `pnpm run ai:visual:audit`. Fix all violations of the Scientific Luxury design system. Key checks: background `#050505`, borders `border-[0.5px] border-white/[0.06]`, only `rounded-sm` (no `rounded-md` or `rounded-lg`), Framer Motion only for animations, no Lucide icons. Check all 63 pages.
**Dependencies:** None
**Evidence to complete:** `ai:visual:audit` passes with 0 critical violations

---

### FE-006: Mobile responsiveness verification and fixes

**Priority:** P2
**Description:** Verify all core user journeys on 375px viewport: lesson player, quiz interface, student dashboard, subscription page, course catalog. Fix any overflow, unreadable text, or broken layouts.
**Dependencies:** None
**Evidence to complete:** Lighthouse mobile score >80 on `/student`, `/courses`, `/subscribe`

---

### FE-007: SEO meta tags audit — all public pages

**Priority:** P2
**Description:** Verify every page under `(public)` has: `title`, `description`, `og:title`, `og:description`, `og:image`, `canonical` URL. Industry pages should have location-specific meta (e.g., "Water restoration training for mining companies in Australia"). Use Next.js `generateMetadata`.
**Dependencies:** None
**Evidence to complete:** Google Rich Results test passes for 3 key pages; all 17 industry pages have unique meta

---

### FE-008: Course catalog — display real IICRC course imagery

**Priority:** P2
**Description:** `docs/COURSES_NEEDING_IMAGES.md` documents courses missing images. After course import (BACK-005), verify all courses have thumbnail images. Courses without images should show a fallback from the design system.
**Dependencies:** BACK-005 (course import)
**Evidence to complete:** `/courses` page shows thumbnails for all imported courses

---

## Backend / API

### BACK-001: Deploy backend to Fly.io

**Priority:** P0 — CRITICAL
**Description:** Execute production deployment of FastAPI backend to Fly.io. Reference `docs/FLY_DEPLOYMENT.md`. Steps: `cd apps/backend && fly deploy`. Verify `https://api.carsi.com.au/health` responds. Set `NEXT_PUBLIC_BACKEND_URL` in Vercel to `https://api.carsi.com.au`.
**Dependencies:** Production PostgreSQL (BACK-002), Redis (BACK-004)
**Evidence to complete:** `curl https://api.carsi.com.au/health` returns `{"status": "ok"}` and smoke tests pass

---

### BACK-002: Provision and migrate production PostgreSQL

**Priority:** P0 — CRITICAL
**Description:** Provision PostgreSQL instance (Fly.io Postgres recommended for simplicity). Run `alembic upgrade head`. Seed admin user `admin@carsi.com.au`. Set `DATABASE_URL` in Fly.io secrets.
**Dependencies:** None
**Evidence to complete:** `alembic current` shows migration 006, admin login works

---

### BACK-003: Add rate limiting to authentication endpoints

**Priority:** P1
**Description:** Install `slowapi` (`uv add slowapi`). Apply `@limiter.limit("5/minute")` to `POST /api/auth/login` and `POST /api/auth/register`. Return 429 with `Retry-After` header on violation.
**Dependencies:** None
**Evidence to complete:** 6th login attempt within 1 minute returns 429

---

### BACK-004: Provision production Redis

**Priority:** P1
**Description:** Provision Redis instance (Upstash Redis recommended — free tier sufficient initially). Set `REDIS_URL` in Fly.io secrets. Verify Celery workers connect and achievement events process.
**Dependencies:** BACK-001 (Fly.io deployment)
**Evidence to complete:** Completing a lesson triggers XP event that Celery processes

---

### BACK-005: Run migration pipeline — import CARSI courses from Google Drive

**Priority:** P1
**Description:** After Drive OAuth is configured (BACK-006), run: `POST /api/lms/migration/discover` then `POST /api/lms/migration/load`. Target: ~40 IICRC-approved courses imported with modules, lessons, and Drive asset links.
**Dependencies:** BACK-006 (Google Drive OAuth prod), production DB (BACK-002)
**Evidence to complete:** `/courses` page shows ≥10 real CARSI courses with working lesson content

---

### BACK-006: Configure Google Drive OAuth for production

**Priority:** P1
**Description:** Configure OAuth2 in Google Cloud Console. Set `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID` in Fly.io secrets. Test `GET /api/lms/drive/files` returns CARSI course files.
**Dependencies:** Google Cloud Console access (Phil)
**Evidence to complete:** `GET /api/lms/drive/files` returns files from `CARSI-LMS-Content`

---

### BACK-007: Configure production SMTP

**Priority:** P1
**Description:** Select SMTP provider (Resend recommended). Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL=hello@carsi.com.au` in Fly.io secrets. Test 3 email templates: enrolment confirmation, certificate, IICRC CEC report.
**Dependencies:** BACK-001
**Evidence to complete:** Real email received at test address after mock enrolment

---

### BACK-008: Switch Stripe to live mode

**Priority:** P1
**Description:** Create live Stripe price (`$795 AUD/year`). Update Fly.io secrets: `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (live). Update Vercel: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live). Configure Stripe webhook to `https://api.carsi.com.au/api/lms/webhooks/stripe`. Update `STRIPE_YEARLY_PRICE_ID`.
**Dependencies:** BACK-001 (backend deployed)
**Evidence to complete:** Test subscription in Stripe live mode succeeds, webhook delivers

---

### BACK-009: Seed 5 IICRC learning pathways

**Priority:** P2
**Description:** Seed production DB with 5 IICRC pathways: WRT, CRT, OCT, ASD, CCT. Each pathway should include: name, description, IICRC discipline code, required courses (from imported catalog), CEC requirements.
**Dependencies:** BACK-002, BACK-005
**Evidence to complete:** `/pathways` page shows 5 pathways with linked courses

---

### BACK-010: Implement `contractors.py` endpoint (currently 503)

**Priority:** P3
**Description:** `contractors.py` route currently returns 503 (degraded/stub). Implement contractor directory or remove the route entirely if not in scope.
**Dependencies:** Decision from Phil on scope
**Evidence to complete:** Either route returns real data or is removed from router

---

## Data / Security

### DATA-001: Dependency vulnerability scan and remediation

**Priority:** P2
**Description:** Run `pnpm audit` (frontend) and `uv run pip audit` or `safety check` (backend). Fix or document all critical and high severity CVEs. Add `pnpm audit --audit-level=high` to CI.
**Dependencies:** None
**Evidence to complete:** CI `pnpm audit` passes with 0 critical vulnerabilities

---

### DATA-002: Verify JWT_SECRET_KEY is not default in production

**Priority:** P1
**Description:** Add CI check that validates `JWT_SECRET_KEY != "CHANGE_ME_GENERATE_WITH_COMMAND_ABOVE"`. Add to `deploy.yml` as a pre-deploy gate.
**Dependencies:** CI pipeline
**Evidence to complete:** CI fails if JWT secret is default value

---

### DATA-003: Implement database backup strategy

**Priority:** P1
**Description:** Configure automated daily backups for production PostgreSQL. If using Fly.io Postgres: enable continuous WAL archiving. If using managed service: enable automatic backups. Test restoration. K8s `storage-backups.yaml` manifest exists for K8s path.
**Dependencies:** BACK-002
**Evidence to complete:** Backup runs automatically, restoration test documented

---

### DATA-004: HTTPS enforcement verification

**Priority:** P1
**Description:** Verify all traffic routes through HTTPS. Vercel: automatic. Fly.io: confirm TLS termination. Add redirect from HTTP → HTTPS if not automatic.
**Dependencies:** BACK-001
**Evidence to complete:** `curl http://api.carsi.com.au` redirects to HTTPS

---

### DATA-005: Git history secrets scan

**Priority:** P2
**Description:** Run `gitleaks detect` or `truffleHog` against full git history. Ensure no API keys, JWT secrets, or passwords are committed. If found, rotate immediately and force-push (with care).
**Dependencies:** None
**Evidence to complete:** `gitleaks detect` returns 0 findings

---

## Automation

### AUTO-001: CI pipeline — add backend tests

**Priority:** P2
**Description:** Verify `ci.yml` runs backend tests. If not, add: `cd apps/backend && uv run pytest --tb=short`. Add `alembic check` to verify migration consistency.
**Dependencies:** None
**Evidence to complete:** CI green with backend + frontend tests both running

---

### AUTO-002: CI pipeline — add Lighthouse performance check

**Priority:** P2
**Description:** `lighthouserc.js` exists. Add a CI job that runs Lighthouse against a preview deployment. Fail if Performance < 70 or Accessibility < 85.
**Dependencies:** None
**Evidence to complete:** CI Lighthouse job runs on every PR

---

### AUTO-003: Configure uptime monitoring

**Priority:** P3
**Description:** Set up monitoring on `https://carsi.com.au` and `https://api.carsi.com.au/health`. Options: Better Uptime (free), Freshping, or UptimeRobot. Alert channel: Slack or email to phil@carsi.com.au.
**Dependencies:** BACK-001
**Evidence to complete:** Alert received within 5 minutes of simulated downtime

---

## Testing / QA

### TEST-001: Verify current backend test status

**Priority:** P1
**Description:** Run `cd apps/backend && uv run pytest -v --tb=short 2>&1 | tee test-results.txt`. Compare against last known baseline (533 passing). Document any regressions.
**Dependencies:** None
**Evidence to complete:** All 66 test files pass; results saved to `reports/test-results/backend-YYYYMMDD.txt`

---

### TEST-002: E2E test — student enrolment to certificate journey

**Priority:** P1
**Description:** Write Playwright spec covering: register → login → browse courses → enrol → open lesson → complete quiz → verify certificate issued → check `/student/credentials`. File: `apps/web/e2e/student-journey.spec.ts`.
**Dependencies:** FE-001 (credentials page)
**Evidence to complete:** Playwright spec passes in CI

---

### TEST-003: E2E test — subscription and payment flow

**Priority:** P1
**Description:** Write Playwright spec covering: browse courses → click subscribe → Stripe checkout → subscription active → access premium content. Use Stripe test card `4242 4242 4242 4242`. File: `apps/web/e2e/subscription.spec.ts`.
**Dependencies:** BACK-008 (Stripe configured)
**Evidence to complete:** Playwright spec passes in CI with test card

---

### TEST-004: E2E test — instructor course creation

**Priority:** P2
**Description:** Write Playwright spec: login as instructor → create course → add module → add lesson → publish → verify course appears in catalog. File: `apps/web/e2e/instructor-flow.spec.ts`.
**Dependencies:** None
**Evidence to complete:** Playwright spec passes

---

### TEST-005: Frontend unit test coverage expansion

**Priority:** P2
**Description:** Add unit tests for: `QuizPlayer`, `EnrolButton`, `LessonPlayer`, `SubscriptionStatus`, `XPLevelBadge`, `StreakTracker`, `CECProgressRing`. Target: each component has at least render, interaction, and error state tests.
**Dependencies:** None
**Evidence to complete:** Frontend test count increases from 21 to ≥40 files

---

## Governance

### GOV-001: Update PROGRESS.md to reflect CARSI LMS phases

**Priority:** P2
**Description:** `PROGRESS.md` currently tracks "Unite-Group Architecture" phases. Update it to track CARSI LMS phases (0-21 + Migration Pipeline + current status). Include: phases complete, in-progress, blocked, and what's remaining.
**Dependencies:** None
**Evidence to complete:** `PROGRESS.md` accurately reflects the current CARSI LMS state

---

### GOV-002: Pre-production checklist final review

**Priority:** P1
**Description:** Walk through `docs/PRE-PRODUCTION-CHECKLIST.md` item by item. Mark each as VERIFIED, IN PROGRESS, or BLOCKED. Report findings.
**Dependencies:** BACK-001, BACK-002
**Evidence to complete:** Checklist reviewed, all P0 items VERIFIED

---

## Visual Excellence

### VIS-001: Implement missing course imagery

**Priority:** P2
**Description:** Reference `docs/COURSES_NEEDING_IMAGES.md`. For courses without imagery, generate or source appropriate restoration training images. Apply consistent image style per `docs/IMAGE_STYLE_GUIDE.md`.
**Dependencies:** BACK-005
**Evidence to complete:** All courses in catalog have imagery

---

### VIS-002: Podcast page content

**Priority:** P2 (was P2 in CONTENT_PARITY_AUDIT)
**Description:** `/podcast` page exists but content status unknown. The WordPress site had "The Science of Property Restoration" podcast. Add podcast episode listings or embed from the hosting platform.
**Dependencies:** Content from Phil
**Evidence to complete:** Podcast page shows ≥3 episodes with playback

---

## Deployment

### DEP-001: Zero-downtime deployment configuration

**Priority:** P2
**Description:** Fly.io: add to `fly.toml`: `[deploy] strategy = "rolling"`. K8s: confirm HPA `minAvailable: 1` in `hpa-pdb.yaml`. Ensures deploys don't cause user-facing downtime.
**Dependencies:** BACK-001
**Evidence to complete:** Deploy to Fly.io completes with 0 downtime (verified by health check polling)

---

### DEP-002: K8s cluster provisioning (optional — if K8s preferred over Fly.io)

**Priority:** P3
**Description:** If DigitalOcean DOKS is chosen over Fly.io: provision cluster, apply all 10 K8s manifests, configure DNS, verify all pods running. Reference `docs/K8S-HOSTING-DECISION.md`.
**Dependencies:** Business decision (Phil) — Fly.io vs K8s
**Evidence to complete:** `kubectl get pods -n carsi` shows all pods Running

---

## Priority Summary

| Priority      | Count  | Tasks                                                                                                                                      |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| P0 — Critical | 4      | BACK-001, BACK-002, FE-001, DATA-002 (JWT)                                                                                                 |
| P1 — High     | 14     | BACK-003 through BACK-009, FE-002, FE-003, FE-004, DATA-003, DATA-004, TEST-001, TEST-002, TEST-003, GOV-002                               |
| P2 — Medium   | 13     | ARCH-002, ARCH-003, FE-005 through FE-008, BACK-009, DATA-001, DATA-005, AUTO-001, AUTO-002, TEST-004, TEST-005, VIS-001, VIS-002, GOV-001 |
| P3 — Low      | 4      | ARCH-001, BACK-010, AUTO-003, DEP-002                                                                                                      |
| **Total**     | **35** |                                                                                                                                            |
