# Current State

> Updated: 17/03/2026 — Session df9bf8a

## Active Task

P0 Auth replacement — COMPLETE. Pushed to main.

## Completed This Session

- **IICRC email**: Wired jenyferr@iicrcnet.org into iicrc_reporter.py + tasks.py + tests ✅
- **Linear**: Updated GP issues for completed work ✅
- **GitHub secret scan**: Rotated Linear API key, fixed scripts to use os.environ ✅
- **P0 Auth replacement** (df9bf8a):
  - Login route fixed to call `/api/lms/auth/login` (was broken — called non-existent `/api/auth/login`)
  - Dual cookie pattern: `auth_token` (httpOnly) + `carsi_token` (JS-readable, for Bearer header)
  - AuthProvider added to root layout
  - 21 files: localStorage `carsi_user_id` replaced with `apiClient` (auto Bearer JWT via cookie)
  - Register form: full_name required (min 2), IICRC member number optional field added
  - Backend RegisterRequest: `iicrc_member_number` field added
  - Login redirect: now uses `?next=` param or defaults to `/student`
  - LMSIconRail: `is_admin` → `roles.includes('admin')`
  - TypeScript: clean (0 errors), backend: 593 passed 0 failed

## Auth Architecture (confirmed)

- Login: `POST /api/auth/login` (Next.js proxy) → `POST /api/lms/auth/login` (FastAPI)
- Cookies set at login: `auth_token` (httpOnly) + `carsi_token` (non-httpOnly, same JWT)
- `apiClient` reads `carsi_token` via `document.cookie`, sets `Authorization: Bearer` header
- Backend middleware validates Bearer JWT → `get_current_lms_user()` extracts email → looks up user
- Logout: `POST /api/auth/logout` (Next.js) clears both cookies

## Next Steps (remaining P0 work)

- Exam pass chain: quiz ≥80% → auto PDF cert + student email + CEC report
- Lesson access gate: check subscription before serving lesson content
- Course import: WP API + Drive DISCOVER pipeline (~91 courses)
- GP-207: Fly.io custom domain api.carsi.com.au

## Key Commit

df9bf8a — feat(auth): replace localStorage dev auth with real JWT cookie system
