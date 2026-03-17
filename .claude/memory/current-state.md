# Current State

> Updated: 17/03/2026 — Session f518952

## Active Task

Industry expansion (SEO/AEO/GEO) — COMPLETE. Pushed to main (f518952).

## Completed This Session

- **IICRC email**: Wired jenyferr@iicrcnet.org into iicrc_reporter.py + tasks.py + tests ✅
- **Linear**: Updated GP issues for completed work ✅
- **GitHub secret scan**: Rotated Linear API key, fixed scripts to use os.environ ✅
- **P0 Auth replacement** (df9bf8a):
  - Login route fixed to call `/api/lms/auth/login` (was broken)
  - Dual cookie pattern: `auth_token` (httpOnly) + `carsi_token` (JS-readable)
  - AuthProvider added to root layout
  - 21 files: localStorage `carsi_user_id` replaced with `apiClient`
  - Register form: full_name required, IICRC member number optional
  - Backend RegisterRequest: `iicrc_member_number` field added
- **Industry expansion** (f518952):
  - 6 new Tier 1 industry pages with full SEO/AEO/GEO stack
  - /industries/plumbing-trades, ndis-disability, gyms-fitness
  - /industries/real-estate, emergency-management, caravan-parks
  - Each page: FAQPage JSON-LD (4 Q&As), answer-first GEO passages
  - Hub expanded from 13 → 19 industries; sitemap updated

## Auth Architecture (confirmed)

- Login: `POST /api/auth/login` (Next.js proxy) → `POST /api/lms/auth/login` (FastAPI)
- Cookies: `auth_token` (httpOnly) + `carsi_token` (non-httpOnly, same JWT)
- `apiClient` reads `carsi_token` via `document.cookie`, sets `Authorization: Bearer`
- Backend middleware validates Bearer JWT → `get_current_lms_user()` extracts email

## Next Steps (remaining P0 work)

- Exam pass chain: quiz ≥80% → auto PDF cert + student email + CEC report
- Lesson access gate: check subscription before serving lesson content
- Course import: WP API + Drive DISCOVER pipeline (~91 courses)
- GP-207: Fly.io custom domain api.carsi.com.au

## Key Commits

- df9bf8a — feat(auth): replace localStorage dev auth with real JWT cookie system
- f518952 — feat(industries): add 6 Tier 1 industry pages with full SEO/AEO/GEO stack
