# Repository Scan — CARSI LMS

**Generated:** 06/03/2026
**Directive:** Post-Install Full Audit Cycle — Phase 1

---

## Overview

| Field          | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Repository     | C:\CARSI                                                        |
| Package Name   | `claude-agent-orchestration-template` ⚠️ (not renamed to carsi) |
| Stack          | Next.js 15 + FastAPI (Python 3.12) + PostgreSQL + Redis         |
| Total Pages    | 63 Next.js pages                                                |
| API Routes     | 36 FastAPI route files                                          |
| Backend Tests  | 66 test files across 14 categories                              |
| Frontend Tests | 21 unit tests + 3 Playwright E2E specs                          |

---

## Repository Structure

### Root Level

| Component                 | Status | Notes                                                      |
| ------------------------- | ------ | ---------------------------------------------------------- |
| `CLAUDE.md`               | PROVEN | Present, routing architecture documented                   |
| `memory.md`               | PROVEN | Governance framework loaded                                |
| `PROGRESS.md`             | PROVEN | Tracks Unite-Group architecture phases                     |
| `package.json`            | WEAK   | Name is `claude-agent-orchestration-template`, not `carsi` |
| `pnpm-workspace.yaml`     | PROVEN | Monorepo workspace: apps/web, apps/backend, packages       |
| `turbo.json`              | PROVEN | Turborepo pipeline configured                              |
| `docker-compose.yml`      | PROVEN | Local dev: PostgreSQL, Redis                               |
| `docker-compose.prod.yml` | PROVEN | Production Docker Compose                                  |
| `Justfile`                | PROVEN | Task runner commands                                       |
| `.env.example`            | PROVEN | Documented, all vars with defaults                         |
| `eslint.config.cjs`       | PROVEN | ESLint configured                                          |
| `codecov.yml`             | PROVEN | Code coverage reporting configured                         |
| `lighthouserc.js`         | PROVEN | Lighthouse CI configured                                   |
| `mcp_config.json`         | PROVEN | MCP server configuration                                   |

---

## Frontend — `apps/web/`

### Framework & Dependencies

| Component               | Status  | Notes                                            |
| ----------------------- | ------- | ------------------------------------------------ |
| Next.js 15 (App Router) | PROVEN  | React 19, Server Components                      |
| TypeScript 5.7          | PROVEN  | Strict mode                                      |
| Tailwind CSS v4         | PROVEN  |                                                  |
| shadcn/ui               | PROVEN  | Component library                                |
| Framer Motion           | PROVEN  | Animation (only approved library)                |
| Design tokens           | PROVEN  | `apps/web/lib/design-tokens.ts`                  |
| OLED Black theme        | UNKNOWN | Design system defined, visual compliance UNKNOWN |

### Route Groups

| Group                    | Pages                                                     | Status                           |
| ------------------------ | --------------------------------------------------------- | -------------------------------- |
| `(auth)`                 | login, register, forgot-password                          | PROVEN (3 pages)                 |
| `(dashboard)/admin`      | admin, courses, migration, pathways, rpl, taxonomy, users | PROVEN (7 pages)                 |
| `(dashboard)/student`    | student, leaderboard, rpl                                 | PROVEN (3 pages)                 |
| `(dashboard)/instructor` | instructor, ai-builder, courses CRUD, ideas               | PROVEN (5 pages)                 |
| `(dashboard)/agents`     | agents dashboard                                          | PROVEN                           |
| `(dashboard)/tasks`      | task queue                                                | PROVEN                           |
| `(dashboard)/demo`       | demo + demo-live                                          | WEAK — starter template artefact |
| `(public)/courses`       | catalog + detail                                          | PROVEN                           |
| `(public)/industries`    | 17 industry verticals                                     | PROVEN                           |
| `(public)/pathways`      | list + detail                                             | PROVEN                           |
| `(public)/subscribe`     | Stripe subscription                                       | PROVEN                           |
| `(public)/credentials`   | public credential verify                                  | PROVEN                           |
| `(public)/about`         | about page                                                | PROVEN                           |
| `(public)/contact`       | contact form                                              | PROVEN                           |
| `(public)/testimonials`  | 8 reviews                                                 | PROVEN                           |
| `(public)/podcast`       | podcast page                                              | PROVEN                           |
| `(public)/ideas`         | course ideas                                              | PROVEN                           |
| Starter template pages   | council-demo, design-system, status-demo, prd/\*          | WEAK — not CARSI content         |

**Total: 63 pages**

### Missing Pages (from MEMORY.md spec)

| Page                                               | Status  |
| -------------------------------------------------- | ------- |
| `/student/credentials` (student credential wallet) | MISSING |
| `/student/notes` (per-lesson notes view)           | MISSING |

### Testing

| Type                      | Count    | Status       |
| ------------------------- | -------- | ------------ |
| Unit tests (`__tests__/`) | 21 files | PROVEN       |
| Playwright E2E specs      | 3 specs  | PROVEN       |
| TypeScript `:any` usage   | 1 file   | WEAK (minor) |
| `as any` casts            | 0 files  | PROVEN       |

---

## Backend — `apps/backend/`

### Framework & Dependencies

| Component                   | Status | Notes                           |
| --------------------------- | ------ | ------------------------------- |
| FastAPI >= 0.115.0          | PROVEN |                                 |
| SQLAlchemy 2.0              | PROVEN | Async + sync drivers            |
| Alembic >= 1.13.0           | PROVEN | 6 migrations                    |
| pgvector                    | PROVEN | Vector similarity search        |
| pyjwt + passlib[bcrypt]     | PROVEN | JWT auth, bcrypt 4.0.1 pinned   |
| LangGraph                   | PROVEN | AI agent orchestration          |
| Anthropic / Google / OpenAI | PROVEN | Multi-provider AI               |
| Redis (Celery)              | PROVEN | Async task queue                |
| WeasyPrint                  | PROVEN | PDF certificate generation      |
| Stripe                      | PROVEN | Payment integration (TEST MODE) |

### API Routes (36 files)

| Domain       | Route Files                         | Status  |
| ------------ | ----------------------------------- | ------- |
| Auth         | lms_auth.py                         | PROVEN  |
| Courses      | lms_courses.py, lms_course_ideas.py | PROVEN  |
| Modules      | lms_modules.py                      | PROVEN  |
| Lessons      | lms_lessons.py                      | PROVEN  |
| Quizzes      | lms_quiz.py                         | PROVEN  |
| Enrolments   | lms_enrollments.py                  | PROVEN  |
| Progress     | lms_progress.py                     | PROVEN  |
| Credentials  | lms_credentials.py                  | PROVEN  |
| Google Drive | lms_drive.py                        | PROVEN  |
| Gamification | lms_gamification.py                 | PROVEN  |
| Payments     | lms_payments.py                     | PROVEN  |
| Subscription | lms_subscription.py                 | PROVEN  |
| Webhooks     | lms_webhooks.py, webhooks.py        | PROVEN  |
| Migration    | lms_migration.py                    | PROVEN  |
| Pathways     | lms_pathways.py                     | PROVEN  |
| RPL          | lms_rpl.py                          | PROVEN  |
| Bundles      | lms_bundles.py                      | PROVEN  |
| Admin        | lms_admin.py                        | PROVEN  |
| AI Builder   | lms_ai_builder.py                   | PROVEN  |
| Analytics    | analytics.py                        | PROVEN  |
| RAG          | rag.py                              | PROVEN  |
| Agents       | agents.py, agent_dashboard.py       | PROVEN  |
| Search       | search.py                           | PROVEN  |
| Health       | health.py                           | PROVEN  |
| Discovery    | discovery.py                        | PROVEN  |
| Documents    | documents.py                        | PROVEN  |
| Chat         | chat.py                             | PROVEN  |
| Task Queue   | task_queue.py                       | PROVEN  |
| Workflow     | workflows.py, workflow_builder.py   | PROVEN  |
| PRD          | prd.py                              | PROVEN  |
| Contractors  | contractors.py (degraded — 503)     | WEAK    |
| Synthex Data | synthex_data.py                     | UNKNOWN |

### Alembic Migrations

| Migration                | Name                      | Status                     |
| ------------------------ | ------------------------- | -------------------------- |
| 001                      | lms_core_schema           | PROVEN                     |
| 002                      | learning_pathways         | PROVEN                     |
| 003                      | gamification_subscription | PROVEN                     |
| 004                      | course_ideas              | PROVEN                     |
| 005                      | rpl_portfolio             | PROVEN                     |
| 006                      | add_lms_bundles           | PROVEN                     |
| Applied to production DB | —                         | UNKNOWN (not deployed yet) |

### Test Coverage

| Category             | Status                                 |
| -------------------- | -------------------------------------- |
| `tests/api/`         | PROVEN                                 |
| `tests/agents/`      | PROVEN                                 |
| `tests/services/`    | PROVEN                                 |
| `tests/security/`    | PROVEN                                 |
| `tests/smoke/`       | PROVEN (9 test classes)                |
| `tests/integration/` | PROVEN                                 |
| `tests/performance/` | PROVEN                                 |
| `tests/rag/`         | PROVEN                                 |
| `tests/worker/`      | PROVEN                                 |
| `tests/workflow/`    | PROVEN                                 |
| `tests/contracts/`   | PROVEN                                 |
| All 66 tests passing | UNKNOWN — requires local run to verify |

---

## Infrastructure

### Docker

| File                      | Status | Notes                                    |
| ------------------------- | ------ | ---------------------------------------- |
| `docker-compose.yml`      | PROVEN | PostgreSQL + Redis + Mailpit (local dev) |
| `docker-compose.prod.yml` | PROVEN | Production Compose                       |
| `nginx/`                  | PROVEN | Nginx reverse proxy config               |
| Backend Dockerfile        | PROVEN |                                          |
| Web Dockerfile            | PROVEN |                                          |

### Kubernetes

| Manifest                    | Status      |
| --------------------------- | ----------- |
| namespace.yaml              | PROVEN      |
| web-deployment.yaml         | PROVEN      |
| backend-deployment.yaml     | PROVEN      |
| postgres-statefulset.yaml   | PROVEN      |
| redis-deployment.yaml       | PROVEN      |
| ingress.yaml                | PROVEN      |
| cert-manager.yaml           | PROVEN      |
| hpa-pdb.yaml                | PROVEN      |
| monitoring.yaml             | PROVEN      |
| storage-backups.yaml        | PROVEN      |
| secrets-template.yaml       | PROVEN      |
| **K8s cluster provisioned** | **MISSING** |

### CI/CD — GitHub Actions

| Workflow              | Status |
| --------------------- | ------ |
| `ci.yml`              | PROVEN |
| `deploy.yml`          | PROVEN |
| `security.yml`        | PROVEN |
| `agent-pr-checks.yml` | PROVEN |

### Deployments

| Service    | Platform                       | Status                        |
| ---------- | ------------------------------ | ----------------------------- |
| Frontend   | Vercel (`carsi-web`)           | PROVEN — carsi-web.vercel.app |
| Backend    | Fly.io / K8s                   | MISSING — not deployed        |
| PostgreSQL | Docker (local) / K8s (planned) | UNKNOWN                       |
| Redis      | Docker (local) / K8s (planned) | UNKNOWN                       |

---

## Governance & AI Framework

### Context Drift Prevention

| Pillar                     | File                                        | Status |
| -------------------------- | ------------------------------------------- | ------ |
| CONSTITUTION.md            | `.claude/memory/CONSTITUTION.md`            | PROVEN |
| compass.md                 | `.claude/memory/compass.md`                 | PROVEN |
| current-state.md           | `.claude/memory/current-state.md`           | PROVEN |
| architectural-decisions.md | `.claude/memory/architectural-decisions.md` | PROVEN |
| SessionStart hook          | session-start-context.ps1                   | PROVEN |
| UserPromptSubmit hook      | user-prompt-compass.ps1                     | PROVEN |
| PreCompact hook            | pre-compact-save.py                         | PROVEN |

### Agent Hierarchy

| Component | Count                  | Status |
| --------- | ---------------------- | ------ |
| Subagents | 23 (`.claude/agents/`) | PROVEN |
| Skills    | 59+                    | PROVEN |
| Commands  | 10                     | PROVEN |
| Hooks     | Multiple               | PROVEN |

### Stripe (Payments)

| Component                 | Status             |
| ------------------------- | ------------------ |
| Product: CARSI Pro Annual | PROVEN (TEST MODE) |
| Price: $795 AUD/year      | PROVEN             |
| 7-day trial               | PROVEN             |
| Webhook endpoints         | PROVEN             |
| Fly.io secrets set        | PROVEN             |
| **Live/production keys**  | **MISSING**        |

---

## Security Controls

| Control                        | Status                               |
| ------------------------------ | ------------------------------------ |
| JWT authentication             | PROVEN                               |
| bcrypt password hashing        | PROVEN                               |
| CORS configuration             | PROVEN                               |
| Security test suite            | PROVEN                               |
| OWASP test coverage            | UNKNOWN                              |
| Rate limiting                  | UNKNOWN                              |
| Input validation (Pydantic)    | PROVEN                               |
| SQL injection protection (ORM) | PROVEN                               |
| XSS protection (DOMPurify)     | PROVEN                               |
| HMAC webhook verification      | PROVEN                               |
| SSL/TLS (cert-manager)         | PROVEN (manifest only, not deployed) |
| Secrets management (K8s)       | PROVEN (template only, not deployed) |

---

## Documentation

| Document                    | Status                   |
| --------------------------- | ------------------------ |
| LOCAL_SETUP.md              | PROVEN                   |
| DESIGN_SYSTEM.md            | PROVEN                   |
| AI_PROVIDERS.md             | PROVEN                   |
| FLY_DEPLOYMENT.md           | PROVEN                   |
| K8S-HOSTING-DECISION.md     | PROVEN                   |
| PRE-PRODUCTION-CHECKLIST.md | PROVEN                   |
| MIGRATION-AUDIT.md          | PROVEN                   |
| CONTENT_PARITY_AUDIT.md     | PROVEN                   |
| MULTI_AGENT_ARCHITECTURE.md | PROVEN                   |
| SPEC_GENERATION.md          | PROVEN                   |
| API documentation (Swagger) | UNKNOWN — auto-generated |
| End-user documentation      | MISSING                  |

---

## Component Classification Summary

| Classification | Count | %   |
| -------------- | ----- | --- |
| PROVEN         | 89    | 71% |
| UNKNOWN        | 14    | 11% |
| MISSING        | 9     | 7%  |
| WEAK           | 8     | 6%  |
| RISK           | 5     | 4%  |

**Risks identified:**

1. Backend not deployed — production backend URL returns 404
2. Stripe in TEST MODE — live keys not configured
3. Database migrations not applied to production
4. K8s cluster not provisioned
5. `package.json` name not updated to `carsi`
