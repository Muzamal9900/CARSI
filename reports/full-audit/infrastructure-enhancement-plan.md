# Infrastructure Enhancement Plan — CARSI LMS

**Generated:** 06/03/2026
**Directive:** Post-Install Full Audit Cycle — Phase 3

---

## Enhancement Pathway Overview

Improvements are ranked by impact-to-effort ratio. Items marked **BLOCKING** must be completed before any subsequent items in their domain can proceed.

---

## 1. Core Infrastructure

### 1.1 Backend Deployment — Fly.io [CRITICAL BLOCKER]

| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| Priority     | P0 — CRITICAL                                  |
| Impact       | Application non-functional without this        |
| Difficulty   | Medium                                         |
| Dependencies | `.env.local` production values, PostgreSQL URL |
| Order        | 1                                              |

**Current state:** Secrets set in Fly.io (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.) but no deployed machine. `FLY_DEPLOYMENT.md` documents the process.

**Enhancement steps:**

1. `fly deploy` from `apps/backend/`
2. Confirm `https://api.carsi.com.au` responds to `/health`
3. Run smoke tests against live URL
4. Update `NEXT_PUBLIC_BACKEND_URL` in Vercel to point to live backend

---

### 1.2 Production PostgreSQL [CRITICAL BLOCKER]

| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| Priority     | P0 — CRITICAL                                  |
| Impact       | No data persistence without this               |
| Difficulty   | Medium                                         |
| Dependencies | Fly.io deployment (1.1) OR standalone Postgres |
| Order        | 2                                              |

**Enhancement steps:**

1. Provision PostgreSQL — options: Fly.io Postgres, Supabase, DigitalOcean Managed DB
2. Set `DATABASE_URL` in Fly.io secrets
3. Run `alembic upgrade head` from `apps/backend/`
4. Seed admin user and initial IICRC courses
5. Verify schema with `alembic current`

---

### 1.3 Redis — Production [HIGH]

| Field        | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Priority     | P1 — HIGH                                                               |
| Impact       | Gamification events, Celery tasks, achievement engine fail without this |
| Difficulty   | Low                                                                     |
| Dependencies | Fly.io deployment (1.1)                                                 |
| Order        | 3                                                                       |

**Enhancement steps:**

1. Provision Redis — Fly.io Redis, Upstash Redis, or DigitalOcean Redis
2. Set `REDIS_URL` in Fly.io secrets
3. Verify Celery workers start and connect

---

### 1.4 Google Drive OAuth — Production [HIGH]

| Field        | Value                                                   |
| ------------ | ------------------------------------------------------- |
| Priority     | P1 — HIGH                                               |
| Impact       | Course content (PDFs, videos) inaccessible without this |
| Difficulty   | Medium                                                  |
| Dependencies | Google Cloud Console OAuth2 setup                       |
| Order        | 4                                                       |

**Enhancement steps:**

1. Configure OAuth2 credentials in Google Cloud Console
2. Set `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN` in Fly.io
3. Run Drive scanner to index `CARSI-LMS-Content` root folder
4. Verify DriveFileViewer loads content in lesson player

---

## 2. Development Infrastructure

### 2.1 Package Identity Correction [LOW]

| Priority   | P3 — LOW                                    |
| ---------- | ------------------------------------------- |
| Impact     | CI labels, npm artefacts, brand consistency |
| Difficulty | Trivial                                     |
| Order      | 5                                           |

Update root `package.json`:

```json
{ "name": "carsi-lms" }
```

---

### 2.2 Starter Template Artefacts Removal [MEDIUM]

| Priority   | P2 — MEDIUM                                       |
| ---------- | ------------------------------------------------- |
| Impact     | Product identity, user confusion, SEO cannibalism |
| Difficulty | Low                                               |
| Order      | 6                                                 |

Remove or redirect these pages:

- `/demo`, `/demo-live` — remove or repurpose as CARSI feature demos
- `/council-demo`, `/design-system`, `/status-demo` — dev-only, remove from production build
- `/prd/*`, `/workflows/*`, `/dashboard/agent-runs` — starter template artefacts, remove or protect behind admin auth

---

### 2.3 Environment Variable Audit [MEDIUM]

| Priority   | P2 — MEDIUM                             |
| ---------- | --------------------------------------- |
| Impact     | Prevents production deployment failures |
| Difficulty | Low                                     |
| Order      | 7                                       |

Actions:

1. Verify all `.env.example` vars are documented
2. Confirm `JWT_SECRET_KEY` enforcement in production (CI check)
3. Add `MAILGUN_API_KEY` or production SMTP vars to `.env.example`
4. Verify `CORS_ORIGINS` includes production domains

---

## 3. Automation Systems

### 3.1 CI Pipeline Verification [MEDIUM]

| Priority   | P2 — MEDIUM                           |
| ---------- | ------------------------------------- |
| Impact     | Broken CI = no automated quality gate |
| Difficulty | Low                                   |
| Order      | 8                                     |

Actions:

1. Verify `ci.yml` runs all: `type-check`, `lint`, `test`
2. Confirm `deploy.yml` triggers on merge to `main`
3. Add backend test run to CI (currently frontend-focused?)
4. Add Alembic migration check to CI: `alembic check`

---

### 3.2 Stripe Live Mode Switch [HIGH]

| Priority   | P1 — HIGH                                  |
| ---------- | ------------------------------------------ |
| Impact     | Revenue collection impossible in test mode |
| Difficulty | Low                                        |
| Order      | 9                                          |

Actions:

1. Create production Stripe price (clone `price_1T7Z5w...`)
2. Update Vercel: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Update Fly.io secrets
4. Update `STRIPE_YEARLY_PRICE_ID` to live price ID
5. Configure Stripe webhook to production backend URL
6. End-to-end test with Stripe's test clock

---

### 3.3 Email — Production SMTP [MEDIUM]

| Priority   | P2 — MEDIUM                                                        |
| ---------- | ------------------------------------------------------------------ |
| Impact     | Enrolment confirmation, certificate delivery, IICRC reports broken |
| Difficulty | Low                                                                |
| Order      | 10                                                                 |

Actions:

1. Select SMTP provider (Resend, Mailgun, SendGrid, AWS SES)
2. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` in Fly.io
3. Set `FROM_EMAIL` to `hello@carsi.com.au`
4. Test 3 email templates: enrolment confirmation, certificate, IICRC CEC report

---

## 4. Governance Enforcement

### 4.1 Completion Claim Protocol — CI Gate [MEDIUM]

| Priority   | P2                                                    |
| ---------- | ----------------------------------------------------- |
| Impact     | Prevents false "done" claims from reaching production |
| Difficulty | Medium                                                |
| Order      | 11                                                    |

Add CI job that runs `pnpm run ai:finished:audit` and blocks merge if score < threshold.

---

### 4.2 Pre-Commit Security Gate [MEDIUM]

| Priority   | P2                                |
| ---------- | --------------------------------- |
| Impact     | Prevents secrets committed to git |
| Difficulty | Low                               |
| Order      | 12                                |

Install `gitleaks` or `truffleHog` pre-commit hook. Confirm no secrets in commit history.

---

## 5. Testing & QA

### 5.1 Frontend Unit Test Coverage [MEDIUM]

| Priority   | P2                                                |
| ---------- | ------------------------------------------------- |
| Impact     | 21 tests for 225 TypeScript files is insufficient |
| Difficulty | Medium                                            |
| Order      | 13                                                |

Target coverage: 50% for critical paths (auth, enrolment, quiz, payment).

Priority components to test:

- `QuizPlayer` — highest complexity
- `EnrolButton` — payment flow entry
- `LessonPlayer` / `DriveFileViewer`
- `SubscriptionStatus`

---

### 5.2 E2E Test Coverage Expansion [HIGH]

| Priority   | P1                                                      |
| ---------- | ------------------------------------------------------- |
| Impact     | 3 Playwright specs for the entire LMS is a critical gap |
| Difficulty | Medium-High                                             |
| Order      | 14                                                      |

Required E2E journeys:

1. Student: register → enrol → lesson → quiz → certificate
2. Stripe: subscribe → trial → payment → access granted
3. Instructor: create course → add module → add lesson → publish
4. Admin: user management → course approval
5. Credential: public verification URL loads without auth

---

### 5.3 Backend Test Pass Verification [HIGH]

| Priority   | P1                                                |
| ---------- | ------------------------------------------------- |
| Impact     | Last confirmed: 533 tests. Current status UNKNOWN |
| Difficulty | Low                                               |
| Order      | 15                                                |

Run: `cd apps/backend && uv run pytest -v --tb=short > test-results.txt`
Target: all 66 test files pass, 533+ assertions.

---

## 6. Observability

### 6.1 Structured Logging [MEDIUM]

| Priority   | P2                                             |
| ---------- | ---------------------------------------------- |
| Impact     | Production errors undetectable without logging |
| Difficulty | Low                                            |
| Order      | 16                                             |

Backend: configure structlog or Python logging to stdout (Fly.io captures stdout).
Frontend: configure Vercel analytics + error reporting.

---

### 6.2 Health Check Endpoint Verification [LOW]

| Priority   | P3                                            |
| ---------- | --------------------------------------------- |
| Impact     | K8s/Fly.io readiness probes require `/health` |
| Difficulty | Trivial                                       |
| Order      | 17                                            |

Verify `/health` returns `{"status": "ok", "db": "connected", "redis": "connected"}`.

---

### 6.3 Uptime Monitoring [LOW]

| Priority   | P3                         |
| ---------- | -------------------------- |
| Impact     | Silent production failures |
| Difficulty | Low                        |
| Order      | 18                         |

Add: Better Uptime, Freshping, or UptimeRobot for `api.carsi.com.au` and `carsi.com.au`.

---

## 7. Security

### 7.1 Rate Limiting on Auth Endpoints [HIGH]

| Priority   | P1                                    |
| ---------- | ------------------------------------- |
| Impact     | Brute force risk on `/api/auth/login` |
| Difficulty | Low                                   |
| Order      | 19                                    |

Add `slowapi` rate limiter to FastAPI: 5 requests/minute on `/api/auth/login` and `/api/auth/register`.

---

### 7.2 HTTPS Enforcement [HIGH]

| Priority   | P1                       |
| ---------- | ------------------------ |
| Impact     | Data in transit exposure |
| Difficulty | Low                      |
| Order      | 20                       |

Verify: Vercel enforces HTTPS (automatic). Fly.io backend — confirm TLS termination or add `X-Forwarded-Proto` redirect.

---

### 7.3 Dependency Vulnerability Scan [MEDIUM]

| Priority   | P2                         |
| ---------- | -------------------------- |
| Impact     | Known CVEs in dependencies |
| Difficulty | Low                        |
| Order      | 21                         |

Run: `pnpm audit` (frontend) and `uv run pip audit` (backend). Add to CI.

---

## 8. Deployment Stability

### 8.1 Database Backup Strategy [HIGH]

| Priority   | P1             |
| ---------- | -------------- |
| Impact     | Data loss risk |
| Difficulty | Medium         |
| Order      | 22             |

K8s manifest `storage-backups.yaml` exists. Ensure:

1. Daily automated backups configured
2. Backup restoration tested
3. Retention policy: 30 days

---

### 8.2 Zero-Downtime Deployment [MEDIUM]

| Priority   | P2                                   |
| ---------- | ------------------------------------ |
| Impact     | User-facing downtime on every deploy |
| Difficulty | Medium                               |
| Order      | 23                                   |

Fly.io: configure rolling deployments (`[deploy] strategy = "rolling"`).
K8s: HPA and PDB manifests already exist — ensure minAvailable > 0.

---

## 9. Visual & UI Quality

### 9.1 Design System Compliance Audit [MEDIUM]

| Priority   | P2                                               |
| ---------- | ------------------------------------------------ |
| Impact     | OLED Black / Scientific Luxury brand consistency |
| Difficulty | Medium                                           |
| Order      | 24                                               |

Run `pnpm run ai:visual:audit`. Verify:

- All backgrounds use `#050505`
- No `rounded-md` or `rounded-lg` (only `rounded-sm` allowed)
- No Lucide icons (Framer Motion only for animation)
- Spectral colours used correctly

---

### 9.2 Mobile Responsiveness Verification [MEDIUM]

| Priority   | P2                                        |
| ---------- | ----------------------------------------- |
| Impact     | Mobile is primary for trade professionals |
| Difficulty | Medium                                    |
| Order      | 25                                        |

Test at 375px (iPhone SE) and 428px (iPhone Pro Max):

- Lesson player
- Quiz interface
- Student dashboard
- Course catalog

---

## 10. AI Orchestration

### 10.1 Real Course Content Import [HIGH]

| Priority   | P1                                               |
| ---------- | ------------------------------------------------ |
| Impact     | Only 1 seeded course — application appears empty |
| Difficulty | Medium                                           |
| Order      | 26                                               |

Run migration pipeline against Google Drive:

1. `POST /api/lms/migration/discover` — scan Drive
2. `POST /api/lms/migration/load` — import courses
3. Verify ~40 IICRC courses appear in catalog

---

### 10.2 IICRC Pathway Seeds [MEDIUM]

| Priority   | P2                            |
| ---------- | ----------------------------- |
| Impact     | Pathway feature appears empty |
| Difficulty | Low                           |
| Order      | 27                            |

Seed 5 IICRC learning pathways:

- WRT (Water Restoration Technician)
- CRT (Carpet Repair & Reinstallation Technician)
- OCT (Odour Control Technician)
- ASD (Applied Structural Drying)
- CCT (Commercial Carpet Cleaning Technician)

---

## Implementation Order Summary

| Order | Item                          | Priority | Estimated Effort |
| ----- | ----------------------------- | -------- | ---------------- |
| 1     | Backend Fly.io deployment     | P0       | 2-4 hrs          |
| 2     | Production PostgreSQL         | P0       | 2-3 hrs          |
| 3     | Redis production              | P1       | 1 hr             |
| 4     | Google Drive OAuth production | P1       | 2-3 hrs          |
| 5     | Stripe live mode switch       | P1       | 1-2 hrs          |
| 6     | Rate limiting on auth         | P1       | 1 hr             |
| 7     | E2E test expansion            | P1       | 1-2 days         |
| 8     | Backend test verification     | P1       | 30 mins          |
| 9     | Real course content import    | P1       | 3-4 hrs          |
| 10    | Missing student pages         | P1       | 1-2 days         |
| 11    | Email production SMTP         | P2       | 2-3 hrs          |
| 12    | Frontend test coverage        | P2       | 2-3 days         |
| 13    | Starter artefacts removal     | P2       | 2-4 hrs          |
| 14    | Package name correction       | P3       | 5 mins           |
| 15    | CI pipeline verification      | P2       | 2-3 hrs          |
| 16    | Design system audit           | P2       | 3-4 hrs          |
| 17    | Mobile responsiveness         | P2       | 1-2 days         |
| 18    | Backup strategy               | P1       | 2-3 hrs          |
| 19    | IICRC pathway seeds           | P2       | 2-3 hrs          |
| 20    | Uptime monitoring             | P3       | 1 hr             |
