# Current State

> Updated: 07/03/2026 AEST

## Active Task

Google Cloud / Google Drive integration setup for CARSI LMS.

## Completed This Session

- Google OAuth2 consent screen configured (External, phill.m@carsi.com.au contact)
- OAuth2 Client ID "CARSI LMS" created with all required origins and redirect URIs
- Credentials distributed to all 3 environments:
  - `apps/backend/.env.local` — GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET updated
  - Vercel production — GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET added via CLI
  - Fly.io backend — GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET set via fly secrets
- Google Drive API confirmed already enabled on carsi-lms project
- Service account `carsi-drive-service@carsi-lms.iam.gserviceaccount.com` created

## Blocked / Pending

- **Service account JSON key creation** — blocked by org policy `iam.disableServiceAccountKeyCreation` enforced at synthex.social org level
- To unblock: Grant `roles/orgpolicy.policyAdmin` at org level (Google Workspace super admin required) OR use OAuth2 user credentials approach instead (recommended — see below)
- **Recommendation:** Use OAuth2 refresh token approach for Drive (no key file needed, avoids org policy entirely) when `FEATURE_GOOGLE_DRIVE` is enabled

## Key Credentials (in .env.local)

- GOOGLE_CLIENT_ID: 931072870726-hbjh5vc8fj00k29bnsdjgk1gtc012et0.apps.googleusercontent.com
- GOOGLE_CLIENT_SECRET: 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
- Service account email: carsi-drive-service@carsi-lms.iam.gserviceaccount.com
- Feature flag: FEATURE_GOOGLE_DRIVE=false (Drive not active yet)

## Next Steps

1. Decide: Option A (override org policy via Workspace admin) or Option B (OAuth2 refresh token for Drive)
2. When Drive feature is ready: implement OAuth2 user credentials flow in backend

## Last Updated

07/03/2026 AEST (manual update)
