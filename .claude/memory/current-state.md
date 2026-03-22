# Current State

> Updated: 22/03/2026 after P0 sweep

## Active Task

P0 sweep from comprehensive site audit complete. Backend deploying to Fly.io.

## Completed This Session

### P0-1: Auth Gate Fix (DONE)

- Removed `/courses` from `PROTECTED_PREFIXES` in `proxy.ts`
- Course catalog now public for SEO and discovery
- Commit: `bed13ab`

### P0-3: Subscribe Success Page (DONE)

- Created `/subscribe/success` page with Framer Motion celebration
- Shows next steps, links to courses and dashboard
- Commit: `bed13ab`

### P0-4: Legal Pages (DONE)

- Created `/terms` (Terms of Service)
- Created `/privacy` (Privacy Policy)
- Australian Privacy Act compliant, IICRC CEC disclosure
- Updated footer with legal links
- Commit: `bed13ab`

### P0-5: Pricing Alignment (DONE)

- Updated `/subscribe` page to show actual Stripe pricing ($795/yr)
- Removed old $44/$99/mo tiers that didn't exist in Stripe
- Matches `prod_U5kbtsOkYEqreA` configuration
- Commit: `bed13ab`

### P0-2: Course Seeding (DONE)

- Created `POST /api/lms/admin/seed-courses` bulk endpoint
- Created `scripts/seed-production.ts` client script
- Backend deployed to Fly.io (version 30)
- Seeded 150 WordPress courses via API
- **Production now has 163 courses** (was 22 before)

## Recent Commits

```
35f05bd feat(admin): add bulk course seed endpoint for production migration
bed13ab fix(security+auth): P0 sweep — auth gates, password reset, accurate revenue
52fa629 docs(audit): comprehensive site audit - 5 P0 issues identified
```

## Production Status

- **Frontend**: https://carsi-web.vercel.app (auto-deploys from main)
- **Backend**: https://carsi-backend.fly.dev (deploying now)
- **Database**: carsi_backend on carsi-db (Fly Postgres)

## Next Steps

1. Fix remaining P1/P2 issues from audit (optional)
2. Monitor production for errors
3. Set up proper CI/CD for Fly.io deploys

## Last Updated

22/03/2026 ~15:00 AEST (P0 sweep complete)
