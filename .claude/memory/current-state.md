# Current State

> Updated: 04/03/2026 AEST. Branch: feature/gamification-subscription-iicrc

## Active Task

WordPress SQL migration pipeline — all 6 phases complete and committed.

## Completed This Session

- Phase 4 (04_lesson_content.py): 714 lessons extracted across 86 courses
- Phase 5 (05_users_enrollments.py): 261 users, 228 enrollments extracted
- Phase 6 (06_load_to_carsi.py): LIVE load executed — 261 users, 90 courses, 90 modules, 714 lessons, 228 enrollments loaded into CARSI PostgreSQL
- Fixed React hydration warning on <body> (suppressHydrationWarning) — committed 3d78e1e

## Database State (local dev, port 5433)

- Total courses: 91 published (90 migrated WP + 1 existing seed WRT)
- Total users: 265 (261 migrated + 4 seed accounts)
- Total enrollments: 229 (228 migrated + 1 seed)
- Migrated users have temp password: CarsiReset2026! (bcrypt hash in lms_users.hashed_password)

## Next Steps (pending)

1. Homepage — / still shows old "AI Agent Orchestration" starter template, needs CARSI landing page
2. GP-131 — RestoreAssist training manual course (blocked on login credentials)
3. GP-128 — Deploy to Vercel Sydney (needs production DB decision)
4. ~30 migrated courses have NULL description — need content enrichment

## Key Files

- scripts/migration/ — all 6 pipeline phases
- scripts/migration/output/ — gitignored JSON outputs (courses, lessons, users, enrollments)
- apps/web/app/layout.tsx — suppressHydrationWarning fix on body tag
