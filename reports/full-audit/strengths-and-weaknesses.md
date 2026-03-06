# Strengths and Weaknesses Analysis — CARSI LMS

**Generated:** 06/03/2026
**Directive:** Post-Install Full Audit Cycle — Phase 2

---

## Strengths

### Architecture & Engineering Quality

**1. Comprehensive LMS Backend (STRONG)**
36 FastAPI route files covering every core LMS domain: auth, courses, modules, lessons, quizzes, enrolments, progress, credentials, drive integration, gamification, payments, subscription, migration, pathways, RPL, bundles, admin, AI builder, analytics, RAG, and webhooks. This is a production-grade API surface.

**2. Well-Structured Frontend Route Groups (STRONG)**
63 Next.js pages organised into three clean route groups: `(auth)`, `(dashboard)`, and `(public)`. Auth is separated, dashboard is protected, public is open. This is the correct Next.js App Router pattern and eliminates middleware complexity.

**3. Type Safety (STRONG)**
Only 1 file uses `: any` and 0 files use `as any` across 225 TypeScript files. This is excellent type discipline and indicates the codebase was built with production intent.

**4. Database Migration Chain (STRONG)**
6 sequential Alembic migrations covering the full schema evolution (core schema → pathways → gamification → course ideas → RPL → bundles). Migrations are tracked and reversible.

**5. Multi-Provider AI Architecture (STRONG)**
Provider abstraction (`selector.py`) supports Ollama (local, default), Anthropic, Google Gemini, and OpenAI. Zero-barrier local development — no API keys required. Clean `complete()`, `chat()`, `generate_embeddings()` interface.

**6. LangGraph Agent Orchestration (STRONG)**
Full agentic layer with long-running agents, PRD generation, workflow builder, and skill system. This is not a toy integration — it's a production-grade AI orchestration architecture.

**7. Comprehensive Test Suite (STRONG)**
66 backend test files across 14 test categories: api, agents, services, security, smoke, integration, performance, RAG, workers, workflows, contracts. This is a professional testing structure.

**8. Payment Integration (STRONG)**
Stripe subscription ($795 AUD/year, 7-day trial) fully integrated. Webhook verification, Fly.io secrets set, Vercel env vars configured. Needs test → live key swap only.

**9. Google Drive Integration (STRONG)**
Recursive scanner, Drive-backed course content, admin file picker, file viewer in lesson player. This is a genuine differentiator for the restoration training market.

**10. IICRC CEC Tracking (STRONG)**
Purpose-built for the restoration industry. Per-student CEC ledger, discipline breakdown (WRT, CRT, OCT, ASD, CCT), IICRC identity card, email reporting. Not generic LMS — domain-specific value.

**11. Achievement & Gamification Engine (STRONG)**
XP/level/streak system, leaderboard, CECProgressRing, event-driven (Redis). Built in from Phase 8 — not bolted on.

**12. PDF Certificate Generation (STRONG)**
WeasyPrint certificates stored in Google Drive. Public verification URL `/credentials/[id]` with LinkedIn share. Zero LinkedIn API dependency.

**13. Governance Framework (STRONG)**
4-pillar context drift prevention, CONSTITUTION.md, 23 subagents, 59+ skills, completion claim blocker. One of the most mature AI governance setups for a project of this scale.

**14. Infrastructure as Code (STRONG)**
10 K8s manifests (backend, web, Postgres StatefulSet, Redis, Nginx, cert-manager, HPA, monitoring, storage backups, secrets). Docker Compose for local and production. 4 GitHub Actions workflows.

**15. Industry Vertical Targeting (STRONG)**
17 industry pages (mining, aged care, commercial cleaning, construction, data centres, education, food processing, government, healthcare, hospitality, insurance, museums, property management, retail, strata, transport). Aggressive SEO targeting.

**16. RPL (Recognition of Prior Learning) (STRONG)**
Full RPL portfolio system — unique in the Australian restoration training market.

**17. Content Quality — Docs (STRONG)**
Comprehensive documentation: AI_PROVIDERS, DESIGN_SYSTEM, FLY_DEPLOYMENT, K8S-HOSTING-DECISION, PRE-PRODUCTION-CHECKLIST, MIGRATION-AUDIT, CONTENT_PARITY_AUDIT, MULTI_AGENT_ARCHITECTURE, BEADS, SPEC_GENERATION.

---

## Weaknesses

### Deployment

**W1. Backend Not Deployed (CRITICAL)**
`https://api.carsi.com.au` returns 404. All frontend API calls to the backend fail in production. The Vercel frontend is live but the application is non-functional for real users.

**W2. K8s Cluster Not Provisioned (HIGH)**
10 K8s manifests exist but no cluster is running. The hosting decision doc (K8S-HOSTING-DECISION.md) recommends DigitalOcean DOKS but no cluster has been created.

**W3. Database Migrations Not Applied to Production (HIGH)**
6 Alembic migrations exist locally but `alembic upgrade head` has not been run against a production database. No production database exists.

**W4. Stripe in TEST MODE (HIGH)**
All Stripe keys in Vercel and Fly.io are test keys. Revenue collection is impossible until live keys are swapped and the subscription flow is verified end-to-end against production Stripe.

### Frontend

**W5. Missing Student Pages (MEDIUM)**
`/student/credentials` (credential wallet) and `/student/notes` (per-lesson notes) are documented as completed phases (Phase 17, Phase 18) in MEMORY.md but the pages do not exist in `apps/web/app/(dashboard)/student/`.

**W6. Starter Template Artefacts Unremoved (LOW)**
Pages from the NodeJS-Starter-V1 template remain: `/demo`, `/demo-live`, `/council-demo`, `/design-system`, `/status-demo`, `/prd/*`, `/workflows/*`, `/dashboard/agent-runs`. These are visible to users and damage the product identity.

**W7. `package.json` Name Not Updated (LOW)**
Root `package.json` name is `claude-agent-orchestration-template` — not `carsi` or `carsi-lms`. Affects npm scripts, CI labels, and build artefacts.

### Testing

**W8. Frontend Test Coverage is Thin (MEDIUM)**
21 frontend unit tests for 225 TypeScript files and 63 pages. Coverage ratio is approximately 9%. Backend has 66 test files; frontend is under-tested by comparison.

**W9. E2E Coverage is Minimal (MEDIUM)**
3 Playwright E2E specs for the entire LMS. Critical user journeys (enrolment → lesson → quiz → certificate, subscription flow, instructor course creation) have no automated E2E coverage.

**W10. Test Pass Status is UNKNOWN (MEDIUM)**
The last confirmed test run was 533 passing (backend). Current status requires a fresh `pnpm turbo run test` to verify. Tests may have drifted.

### Security

**W11. Rate Limiting Not Verified (MEDIUM)**
No evidence of rate limiting on auth endpoints. The security test suite exists but OWASP coverage depth is UNKNOWN.

**W12. JWT Secret is Default in .env.example (LOW)**
`JWT_SECRET_KEY=CHANGE_ME_GENERATE_WITH_COMMAND_ABOVE` — this is correctly flagged in the file but requires a production enforcement mechanism to ensure it's never deployed with the default value.

### Content

**W13. Course Content Missing (MEDIUM)**
Seed data shows only 1 published course (WRT). CARSI has ~40 IICRC-approved courses but none are imported. The migration pipeline exists but has not been run against the real Google Drive content.

**W14. Student Leaderboard Is Sparse (LOW)**
Leaderboard requires real student data to be meaningful. With 1 seeded student, this page provides no value in its current state.

---

## Risks

| Risk                                       | Severity | Likelihood | Impact                                  |
| ------------------------------------------ | -------- | ---------- | --------------------------------------- |
| Backend unreachable in production          | CRITICAL | Certain    | Application is non-functional for users |
| Stripe test mode goes live by accident     | HIGH     | Medium     | Fake transactions, compliance issues    |
| DB migration fails on first production run | HIGH     | Low-Medium | Data loss or startup failure            |
| Student credential/notes pages missing     | HIGH     | Certain    | Core student experience incomplete      |
| JWT_SECRET_KEY default in production       | HIGH     | Low        | Authentication compromise               |
| Google Drive OAuth not configured          | HIGH     | Unknown    | Course content inaccessible             |

---

## Unknown Areas

| Area                                       | Why Unknown                                                    |
| ------------------------------------------ | -------------------------------------------------------------- |
| Test suite current pass/fail status        | Requires local execution                                       |
| Google Drive OAuth configuration           | Setup requires Google Cloud Console — not verifiable from repo |
| Fly.io deployment actual state             | Secrets set but deployment not confirmed live                  |
| Production database existence              | No confirmed PostgreSQL instance anywhere                      |
| Stripe webhook delivery in production      | Requires backend URL to be live                                |
| Lighthouse performance scores              | Requires running against live instance                         |
| OWASP security test coverage depth         | Security test files exist, content not reviewed                |
| Real CARSI course content import           | Migration pipeline exists, Drive data not scanned              |
| Email delivery (Mailpit → production SMTP) | Mailpit is local only — production SMTP not confirmed          |
