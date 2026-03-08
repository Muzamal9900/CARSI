# CARSI — Agent Context File
> LMS platform for professional cleaning and restoration training.

## Project Identity
- **Team:** GP (G-Pilot)
- **Linear Project:** CARSI (20538e04-ba27-467d-b632-1fb346063089)
- **Repo:** CleanExpo/CARSI
- **Local:** /home/phillmcgurk/projects/CARSI
- **Domain:** carsi.com.au (planned)
- **State:** Backlog (replacing WordPress)

## Architecture
- **Framework:** Next.js 14+ (App Router ONLY)
- **Language:** TypeScript (strict: true)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe (course purchases, bundles)
- **Video:** Mux or Cloudflare Stream
- **Certificates:** PDF generation (React PDF)
- **Hosting:** Vercel

## Core Modules
1. **Course Builder** — Admin tool: modules, lessons, quizzes, resources
2. **Student Portal** — Enroll, progress tracking, certificates
3. **Assessment Engine** — MCQ, practical assessments, portfolio
4. **Certificate System** — Auto-generated PDF, verification URL
5. **Instructor Dashboard** — Grading, analytics, student management
6. **Payment** — Stripe checkout, course bundles, team licenses
7. **Compliance Tracking** — CPD points, certification expiry, renewal
8. **Content Library** — Video hosting, downloadable resources
9. **Admin Panel** — User management, course analytics, revenue

## Coding Rules
- App Router ONLY — NextRequest/NextResponse from next/server
- Never rewrite existing files — extend only
- Accessibility: WCAG AA minimum (training platform)
- Branch naming: `bron/gp-{issue-number}-{description}`

## Engineering Framework
See: /home/phillmcgurk/.openclaw/workspace/ENGINEERING-FRAMEWORK.md
