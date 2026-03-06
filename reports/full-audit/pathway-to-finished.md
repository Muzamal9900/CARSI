# Pathway to Finished — CARSI LMS

**Generated:** 06/03/2026
**Directive:** Post-Install Full Audit Cycle — Phase 4

---

## Definition of "Finished" (from memory.md governance framework)

"Finished" means **production-ready SaaS** with the following verified:

**Frontend:**

- No critical 404 routes
- Assets load correctly
- Responsive at mobile (375px) and desktop (1440px)
- No JavaScript runtime errors in console

**Backend:**

- All API endpoints return expected responses
- Authentication is functional
- Database operations complete without errors
- Error handling returns appropriate HTTP codes

**Infrastructure:**

- Docker containers start cleanly
- Environment variables all set
- Health checks pass
- Database migrations applied

**Testing:**

- All unit tests pass
- Integration tests pass
- No critical security vulnerabilities

**Business Readiness:**

- Payment flow functional
- User onboarding working
- Core user journeys verified end-to-end

---

## Current Status

| Domain            | Status         | Evidence                                                    |
| ----------------- | -------------- | ----------------------------------------------------------- |
| Frontend (Vercel) | 🟡 IN PROGRESS | Live at carsi-web.vercel.app, starter artefacts present     |
| Backend API       | 🔴 BLOCKED     | Not deployed — api.carsi.com.au returns 404                 |
| Database          | 🔴 BLOCKED     | No production DB — migrations not applied                   |
| Redis             | 🔴 BLOCKED     | No production Redis instance                                |
| Payments          | 🟡 IN PROGRESS | TEST MODE only — live keys not configured                   |
| Google Drive      | 🔴 UNKNOWN     | OAuth not confirmed for production                          |
| Email             | 🔴 UNKNOWN     | Mailpit local only — production SMTP not set                |
| Core content      | 🔴 BLOCKED     | ~40 courses not imported                                    |
| Test suite        | 🟡 UNKNOWN     | Last known: 533 passing (backend), current state unverified |
| Security          | 🟡 IN PROGRESS | Auth present, rate limiting MISSING                         |

**Overall: IN PROGRESS — estimated 40-60% of production-ready state achieved**

---

## Critical Blockers

These must be resolved before the application is usable for real customers.

### BLOCKER 1 — Backend Deployment

**What:** `api.carsi.com.au` returns 404. Every backend API call from the frontend fails.
**Evidence Required:** `curl https://api.carsi.com.au/health` returns `{"status": "ok"}`
**Estimated Effort:** 2-4 hours

### BLOCKER 2 — Production Database

**What:** No PostgreSQL instance. No data can be saved or read.
**Evidence Required:** `alembic current` shows `head` on production DB
**Estimated Effort:** 2-3 hours

### BLOCKER 3 — Missing Student Pages

**What:** `/student/credentials` and `/student/notes` are documented as complete but pages do not exist.
**Evidence Required:** Both pages render with correct data for seeded student
**Estimated Effort:** 1-2 days

### BLOCKER 4 — Course Content Not Imported

**What:** Only 1 seeded test course exists. CARSI has ~40 IICRC-approved courses.
**Evidence Required:** `/courses` catalog shows ≥10 real CARSI courses with content
**Estimated Effort:** 3-4 hours (after Drive OAuth configured)

### BLOCKER 5 — Stripe TEST MODE

**What:** Live Stripe keys not configured. Revenue collection impossible.
**Evidence Required:** Successful $795 AUD subscription charge in Stripe live dashboard
**Estimated Effort:** 1-2 hours

---

## Required Systems

### Systems Built (verified as complete)

| System                               | Evidence                                    |
| ------------------------------------ | ------------------------------------------- |
| Auth (JWT + bcrypt)                  | Route files + test coverage confirmed       |
| Course catalog                       | `/courses` page + `lms_courses.py` API      |
| Module/Lesson CRUD                   | Routes + instructor dashboard               |
| Quiz engine                          | `lms_quiz.py` + QuizPlayer component        |
| Enrolment flow                       | `lms_enrollments.py` + EnrolButton          |
| Gamification (XP/streak/leaderboard) | `lms_gamification.py` + frontend components |
| IICRC CEC tracking                   | `lms_credentials.py` + CECProgressRing      |
| PDF certificate generation           | WeasyPrint integration                      |
| Public credential verification       | `/credentials/[id]` page                    |
| LinkedIn share                       | LinkedInShareButton (no API key)            |
| Google Drive integration             | `lms_drive.py` + DriveFileViewer            |
| Subscription ($795/year)             | `lms_subscription.py` + Stripe              |
| RPL portfolio                        | `lms_rpl.py` + student RPL page             |
| Admin panel                          | 7 admin pages + `lms_admin.py`              |
| Instructor dashboard                 | Course builder + AI builder                 |
| Migration pipeline                   | `lms_migration.py` + Drive scanner          |
| Learning pathways                    | `lms_pathways.py` + public pages            |
| 17 industry pages                    | SEO-targeted verticals                      |
| Email notifications                  | `email_service.py` + 3 Celery templates     |
| Achievement engine                   | Event-driven Redis system                   |
| Bundle pricing                       | `lms_bundles.py` + BundlePricingCard        |
| AI course builder                    | `lms_ai_builder.py`                         |
| Student notes                        | `lms_notes.py` backend (frontend MISSING)   |
| PWA + offline                        | service worker + manifest.json              |
| Dark/light theme                     | ThemeProvider + ThemeToggle                 |

### Systems Missing or Incomplete

| System                      | Gap                                                | Priority |
| --------------------------- | -------------------------------------------------- | -------- |
| `/student/credentials` page | Frontend page not created despite backend complete | P0       |
| `/student/notes` page       | Frontend page not created despite backend complete | P1       |
| Production backend          | Not deployed                                       | P0       |
| Production DB               | Not provisioned                                    | P0       |
| Production Redis            | Not provisioned                                    | P1       |
| Google Drive OAuth (prod)   | Setup required                                     | P1       |
| IICRC pathway seeds         | 5 pathways to seed                                 | P2       |
| Real course import          | ~40 courses to migrate from Drive                  | P1       |
| Production SMTP             | Email delivery broken                              | P1       |
| Rate limiting               | Auth brute force vulnerability                     | P1       |

---

## Recommended Implementation Order

### Sprint 1 — Make It Work (Week 1)

**Goal:** Application functional for the first real user.

| Task                                | Owner               | Evidence                     |
| ----------------------------------- | ------------------- | ---------------------------- |
| Deploy backend to Fly.io            | Backend specialist  | `/health` 200                |
| Provision PostgreSQL                | Backend specialist  | `alembic current` = head     |
| Provision Redis                     | Backend specialist  | Celery workers start         |
| Run `alembic upgrade head`          | Backend specialist  | Schema verified              |
| Configure Google Drive OAuth (prod) | Backend specialist  | Drive scanner returns files  |
| Run migration pipeline              | Admin action        | ≥10 courses in catalog       |
| Build `/student/credentials` page   | Frontend specialist | Page renders credential list |
| Build `/student/notes` page         | Frontend specialist | Notes CRUD functional        |

---

### Sprint 2 — Make Money (Week 2)

**Goal:** Revenue collection enabled.

| Task                             | Owner              | Evidence                    |
| -------------------------------- | ------------------ | --------------------------- |
| Switch Stripe to live mode       | Backend specialist | Live price ID set           |
| Configure production webhook URL | Backend specialist | Webhook delivers events     |
| End-to-end subscription test     | QA                 | $795 charge in Stripe live  |
| Configure production SMTP        | Backend specialist | Enrolment email received    |
| Seed 5 IICRC pathways            | Admin action       | Pathways visible in catalog |
| Add rate limiting to auth        | Backend specialist | 429 after 5 failed logins   |

---

### Sprint 3 — Polish and Protect (Week 3-4)

**Goal:** Production-grade stability and quality.

| Task                               | Owner               | Evidence                             |
| ---------------------------------- | ------------------- | ------------------------------------ |
| Remove starter template artefacts  | Frontend specialist | Pages 404 or redirect                |
| Update `package.json` name         | Developer           | `"name": "carsi-lms"`                |
| Expand E2E tests (5 journeys)      | Test engineer       | All 5 specs pass                     |
| Expand frontend unit tests         | Test engineer       | >50% coverage on critical components |
| Design system compliance audit     | Frontend specialist | `ai:visual:audit` passes             |
| Mobile responsiveness verification | Frontend specialist | Lighthouse mobile >80                |
| Dependency vulnerability scan      | Security auditor    | 0 critical CVEs                      |
| Configure uptime monitoring        | Deploy guardian     | Alert configured                     |
| Database backup strategy           | Deploy guardian     | Daily backup verified                |
| HTTPS enforcement verification     | Security auditor    | All routes HTTPS                     |

---

### Sprint 4 — Growth Ready (Week 5-6)

**Goal:** Content and SEO foundation.

| Task                         | Owner                 | Evidence                          |
| ---------------------------- | --------------------- | --------------------------------- |
| Import all ~40 CARSI courses | Admin action          | Full catalog live                 |
| Content parity final audit   | Docs writer           | P0 gaps resolved                  |
| SEO meta tags all pages      | Frontend specialist   | og:title, og:description verified |
| Schema markup (Course, FAQ)  | SEO specialist        | Google Rich Results test passes   |
| Lighthouse performance >80   | Performance optimiser | CI Lighthouse job green           |
| Analytics integration        | Frontend specialist   | Events tracked                    |

---

## Final Production Readiness Checklist

### Infrastructure

- [ ] `https://api.carsi.com.au/health` returns 200
- [ ] `https://carsi.com.au` loads with HTTPS
- [ ] PostgreSQL connected and migrated to head
- [ ] Redis connected and Celery workers running
- [ ] Google Drive OAuth configured and Drive content accessible
- [ ] Production SMTP delivering emails

### Payments

- [ ] Stripe live mode keys configured
- [ ] $795 AUD/year subscription charge verified
- [ ] 7-day trial confirmed working
- [ ] Webhook delivery confirmed to production URL
- [ ] Payment success page functional

### Core User Journeys

- [ ] Student: register → verify email → browse courses
- [ ] Student: enrol (free course) → watch lesson → complete quiz → download certificate
- [ ] Student: subscribe ($795) → unlock premium content
- [ ] Student: view credential wallet at `/student/credentials`
- [ ] Instructor: create course → add module → add lesson → publish
- [ ] Admin: approve user, view analytics, manage taxonomy
- [ ] Public: verify credential at `/credentials/[id]` without login
- [ ] Public: browse industry verticals (17 pages load without error)

### Quality Gates

- [ ] All backend tests passing (66 files, 533+ assertions)
- [ ] All frontend unit tests passing (21 files)
- [ ] All 3 Playwright E2E specs passing
- [ ] TypeScript type-check clean (0 errors)
- [ ] ESLint clean (0 errors)
- [ ] 0 critical dependency vulnerabilities
- [ ] No console errors on any page
- [ ] Lighthouse Performance >80 (mobile)
- [ ] Lighthouse Accessibility >90

### Security

- [ ] JWT secret is not the default value
- [ ] Rate limiting active on `/api/auth/login`
- [ ] HTTPS enforced on all routes
- [ ] CORS limited to `carsi.com.au` and `api.carsi.com.au`
- [ ] No secrets in git history

### Content

- [ ] ≥10 CARSI courses visible in catalog
- [ ] 5 IICRC pathways seeded
- [ ] About page accurate
- [ ] Contact form submits successfully
- [ ] All 17 industry pages load without errors

### Business

- [ ] Terms of Service page exists
- [ ] Privacy Policy page exists
- [ ] IICRC CEC reporting email functional
- [ ] Support contact documented
- [ ] Stripe webhook monitoring configured

---

## Completion Estimate

| Stage                       | Status          | Estimated Completion           |
| --------------------------- | --------------- | ------------------------------ |
| Sprint 1 (Make It Work)     | NOT STARTED     | 1 week of focused effort       |
| Sprint 2 (Make Money)       | NOT STARTED     | +1 week                        |
| Sprint 3 (Polish & Protect) | NOT STARTED     | +2 weeks                       |
| Sprint 4 (Growth Ready)     | NOT STARTED     | +2 weeks                       |
| **Full Production Ready**   | **NOT STARTED** | **~6 weeks of focused effort** |

**Current production readiness score: 35-40%**
Critical infrastructure gaps (backend, DB, Redis) prevent real user onboarding.
