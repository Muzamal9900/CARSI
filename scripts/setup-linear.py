"""
CARSI Linear Project Setup
Creates all 15 phases as issues in the CARSI Linear project (G-Pilot team).
Run: python scripts/setup-linear.py
"""
import json
import urllib.request
import urllib.error

API_KEY = "lin_api_REDACTED"
PROJECT_ID = "20538e04-ba27-467d-b632-1fb346063089"
TEAM_ID = "91b3cd04-86eb-422d-81e2-9aa37db2f2f5"
BACKLOG_STATE_ID = "fd635199-7bd7-442a-9df0-8c9afda1d646"
FEATURE_LABEL_ID = "ef4038bd-da33-4d61-8d85-a772ef78dc1d"
CONFIG_LABEL_ID = "98c12bc0-e6a8-46db-9d0c-2583db3ec2f0"

# Priority: 1=Urgent, 2=High, 3=Medium, 4=Low
PHASES = [
    {
        "title": "Phase 0: Foundation Setup",
        "description": """## Foundation Setup

Clone NodeJS-Starter-V1, configure Docker services, create .env.local, set up Google Drive OAuth2, and wire Linear project tracking.

### Tasks
- [ ] Clone https://github.com/CleanExpo/NodeJS-Starter-V1.git into C:/CARSI
- [ ] Verify prerequisites: Node 20+, pnpm 9+, Python 3.12+, Docker
- [ ] Run pnpm install and verify 343+ starter tests pass
- [ ] Create .env.local with all CARSI variables (DB, Redis, JWT, Google, Linear)
- [ ] Configure Docker: update postgres credentials, add Mailpit service
- [ ] Start Docker services and verify all containers healthy
- [ ] Set up Google Cloud Console project + Google Drive API OAuth2
- [ ] Create CARSI-LMS-Content folder in Google Drive, update .env.local
- [ ] Commit .env.example (never commit .env.local)

### Acceptance Criteria
- `pnpm run docker:up` starts postgres, redis, mailpit with no errors
- `pnpm dev` runs frontend on :3000 and backend on :8000
- All starter tests pass: `pnpm turbo run test`
- Google Drive OAuth2 credentials in .env.local""",
        "priority": 1,
        "labels": [CONFIG_LABEL_ID],
    },
    {
        "title": "Phase 1: LMS Database Schema",
        "description": """## LMS Database Schema

Create all LMS tables via a single Alembic migration. Tables cover users, roles, courses, modules, lessons, enrolments, progress, quizzes, IICRC CEC tracking, certificates, and Google Drive assets.

### New Tables
- users, roles, user_roles
- courses (with iicrc_discipline, cec_hours, cppp40421_unit_code fields)
- modules, lessons
- enrollments, progress
- quizzes, quiz_questions, quiz_attempts
- cec_transactions (IICRC CEC ledger per student)
- certificates (with public credential_id)
- lesson_notes
- drive_assets

### Tasks
- [ ] Write failing test: verify all expected tables exist after migration
- [ ] Create alembic/versions/001_lms_core_schema.py
- [ ] Run: alembic upgrade head
- [ ] Confirm all tests pass

### Acceptance Criteria
- All 15 tables created with correct columns and foreign keys
- Roles table seeded with: admin, instructor, student
- Migration is reversible (downgrade drops all tables cleanly)""",
        "priority": 1,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 2: SQLAlchemy ORM Models",
        "description": """## SQLAlchemy ORM Models

Create Python SQLAlchemy 2.0 ORM models for every LMS entity. Each model maps 1:1 to the migration schema with correct relationships.

### Models to Create
- User, Role, UserRole
- Course (with iicrc_discipline, cec_hours, cppp40421 fields)
- Module, Lesson
- Enrollment, Progress
- Quiz, QuizQuestion, QuizAttempt
- CECTransaction
- Certificate
- LessonNote
- DriveAsset

### Tasks
- [ ] Write failing tests for each model (create, read, relationship traversal)
- [ ] Implement each model class
- [ ] Verify all model tests pass
- [ ] Commit

### Acceptance Criteria
- Can create a Course with Modules > Lessons > Quiz chain via ORM
- Can create an Enrollment and track Progress per Lesson
- CECTransaction correctly linked to student and course""",
        "priority": 1,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 3: Authentication & Role-Based Access",
        "description": """## Authentication & Role-Based Access Control

Extend the starter's JWT auth system to support LMS roles: admin, instructor, student. Role assigned on registration and enforced via dependency injection on all protected endpoints.

### Tasks
- [ ] Write failing test: student registers with role='student', role assigned correctly
- [ ] Write failing test: student cannot access instructor-only endpoint (403)
- [ ] Write failing test: admin can access all endpoints
- [ ] Extend /api/v1/auth/register to accept role parameter
- [ ] Create require_role() FastAPI dependency
- [ ] Confirm all auth tests pass

### Acceptance Criteria
- Registration assigns correct role from: student, instructor, admin
- Role enforcement returns 403 for unauthorised access
- JWT token includes role claim for frontend use""",
        "priority": 1,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 4: Course CRUD API",
        "description": """## Course Management API (FastAPI)

CRUD endpoints for courses with role gating. Instructors create/edit their own courses. Public list endpoint shows only published courses. Courses include IICRC discipline and CPP40421 unit mapping.

### Endpoints
- POST /api/v1/courses (instructor/admin only)
- GET /api/v1/courses (public, published only, paginated)
- GET /api/v1/courses/{slug} (public)
- PATCH /api/v1/courses/{slug} (owner instructor / admin)
- DELETE /api/v1/courses/{slug} (owner instructor / admin)
- POST /api/v1/courses/{slug}/publish (admin only)

### IICRC Fields on Course
- iicrc_discipline: WRT | CRT | OCT | ASD | CCT
- cec_hours: numeric
- cppp40421_unit_code: e.g. CPPCLO4027
- cppp40421_unit_name: full unit name

### Tasks
- [ ] Write failing tests for all endpoints and role restrictions
- [ ] Create CourseCreate, CourseUpdate, CourseOut Pydantic schemas
- [ ] Implement course router
- [ ] Register router in main app
- [ ] All tests pass

### Acceptance Criteria
- Student gets 403 on course creation
- Instructor can only edit their own courses
- Published courses visible without auth
- Draft courses not visible publicly""",
        "priority": 2,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 5: Google Drive Integration",
        "description": """## Google Drive Integration (Backend)

DriveService class wraps Google Drive API v3. Instructors browse their CARSI Drive folder and attach files to lessons. Certificates generated in Phase 8 are also stored in Drive.

### Tasks
- [ ] pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
- [ ] Write failing tests for DriveService (mock Drive API)
- [ ] Create apps/backend/app/services/google_drive.py
- [ ] Implement: list_files_in_folder(), get_file_metadata(), upload_file()
- [ ] Create GET /api/v1/drive/files endpoint (instructor/admin only)
- [ ] Create GET /api/v1/drive/files/{file_id} endpoint
- [ ] All tests pass

### Acceptance Criteria
- DriveService lists files from GOOGLE_DRIVE_FOLDER_ID
- Instructors can browse Drive files via API
- File metadata (name, mimeType, size, webViewLink) returned correctly
- Drive credentials obtained via OAuth2 flow, stored in session""",
        "priority": 2,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 6: Course Catalog (Next.js Frontend)",
        "description": """## Public Course Catalog

Next.js 15 Server Component pages for public course browsing. ISR (Incremental Static Regeneration) every 60 seconds. Filters by IICRC discipline, Cert IV unit, level. Mobile-first with both light and dark theme support.

### Pages / Components
- /courses — Course catalog grid
- /courses/[slug] — Course detail with module list and first lesson preview
- CourseCard component (thumbnail, title, discipline badge, CEC hours, price)
- CourseGrid with filter sidebar (discipline, level)
- DisciplineBadge (WRT, CRT, etc.) with colour coding

### Tasks
- [ ] Write Vitest tests for CourseCard component
- [ ] Create CourseCard.tsx
- [ ] Write test for CourseGrid renders correct count
- [ ] Create CourseGrid.tsx
- [ ] Create /courses/page.tsx (Server Component, calls API)
- [ ] Create /courses/[slug]/page.tsx (course detail)
- [ ] All component tests pass
- [ ] Verify pages load in browser

### Acceptance Criteria
- Catalog page shows all published courses
- IICRC discipline badge visible on each card
- CEC hours displayed on each card
- Filters work for discipline and level
- No layout break on mobile""",
        "priority": 2,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 7: Enrolment System",
        "description": """## Enrolment System

Students enrol in courses (free and paid). Enrolment gates access to lesson content. Duplicate enrolment prevention. Enrolment status tracked (active, completed, suspended).

### Endpoints
- POST /api/v1/enrollments (student auth required)
- GET /api/v1/enrollments/me (student's own enrolments)
- GET /api/v1/enrollments/{id} (own enrolment detail)

### Frontend
- Enrol button on course detail page
- Enrolled state (Continue Learning button)
- My Courses list on student dashboard (stub)

### Tasks
- [ ] Write failing tests: enrol in free course, duplicate enrolment returns 409
- [ ] Create Enrollment schema and router
- [ ] Add enrolment check to lesson access (non-enrolled student gets 403)
- [ ] Create Enrol button component in Next.js
- [ ] All tests pass

### Acceptance Criteria
- Student can enrol in a free course
- Enrolling twice returns 409 Conflict
- Non-enrolled student cannot access lesson content
- Enrolment list returns only the requesting student's enrolments""",
        "priority": 2,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 8: Achievement Engine — IICRC CEC + Certificates",
        "description": """## Achievement Engine — IICRC CEC Tracking + Certificate Generation

Event-driven system built on Redis. Every significant student action fires a typed event. Background worker processes events: awards IICRC CECs, generates branded PDF certificates, creates public credential records.

### Event Types
- LessonCompleted → { student_id, lesson_id, course_id, time_spent_seconds }
- QuizPassed → { student_id, quiz_id, score_pct, course_id }
- CourseCompleted → { student_id, course_id, iicrc_discipline, cec_hours }

### Worker Actions on CourseCompleted
1. Add CECs to cec_transactions table
2. Generate certificate PDF (WeasyPrint)
3. Upload PDF to Google Drive under CARSI-Certificates/{student_id}/
4. Create certificate record with unique credential_id
5. Create public credential verification record

### Certificate PDF Contains
- Student full name
- Course title + IICRC discipline code
- CEC hours awarded
- CPP40421 unit code/name (where applicable)
- Date of completion
- Verification URL: carsi.com.au/credentials/{credential_id}
- CARSI branding

### Endpoints
- GET /credentials/{credential_id} — PUBLIC, no auth, returns credential verification data

### Tasks
- [ ] pip install weasyprint celery
- [ ] Write failing test: CourseCompleted event creates cec_transaction record
- [ ] Write failing test: CourseCompleted event creates certificate record
- [ ] Implement Redis event publisher (fire_event() utility)
- [ ] Implement Celery worker: handle_course_completed()
- [ ] Create WeasyPrint HTML certificate template
- [ ] Implement certificate PDF generation + Drive upload
- [ ] Create public /credentials/{id} endpoint
- [ ] Integration test: complete a course, verify CEC record + certificate exist
- [ ] All tests pass

### Acceptance Criteria
- LessonCompleted event fires when student marks lesson done
- CourseCompleted event fires when all lessons complete
- CECTransaction created with correct discipline and hours
- Certificate PDF generated and stored in Google Drive
- /credentials/{id} returns valid JSON without auth
- credential_id is short, human-readable (e.g. CARSI-WRT-2026-001)""",
        "priority": 2,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 9: Student Dashboard",
        "description": """## Student Dashboard

Post-login landing page for students. Shows: continue learning (resume last course), IICRC CEC total, credentials wallet (all certificates), CPP40421 Cert IV progress map, lesson notes summary.

### Dashboard Sections
1. **Continue Learning** — Resume card with progress bar for in-progress courses
2. **My CEC Credits** — Total CECs this year, breakdown by discipline (WRT: 14, CRT: 8...)
3. **Credentials Wallet** — All certificates: download PDF, copy URL, LinkedIn share button
4. **Cert IV Progress** — Which CPP40421 units completed vs. remaining
5. **My Notes** — Recent lesson notes across all courses

### Components
- CECCounter (total + discipline breakdown)
- CredentialCard (course, discipline badge, CECs, date, actions)
- CertIVProgressMap (unit grid, completed = ticked)
- ProgressBar (reusable, % complete)
- LinkedInShareButton (opens pre-filled LinkedIn URL)

### Tasks
- [ ] Write Vitest tests for CECCounter renders correct total
- [ ] Write test for CredentialCard shows LinkedIn share button
- [ ] Create all dashboard components
- [ ] Create /student/dashboard page (Server Component + Client islands)
- [ ] Wire API calls to backend (CECs, enrollments, certificates)
- [ ] LinkedIn share button opens correct URL with pre-filled fields
- [ ] All tests pass

### Acceptance Criteria
- Dashboard shows correct CEC total matching database
- Each credential card has working Download, Copy URL, LinkedIn share
- LinkedIn share URL pre-fills: title, CARSI, date, credential URL
- Cert IV progress map shows correct completed/remaining units
- Mobile layout works on 375px width""",
        "priority": 2,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 10: Lesson Player + Notes + PWA",
        "description": """## Lesson Player with Notes Panel and PWA Offline Support

Distraction-free lesson player supporting: text (rich), video, PDF, and Google Drive file embeds. Collapsible notes panel (per-lesson private notes). PWA service worker caches current lesson for offline use.

### Lesson Player Features
- Full-width distraction-free layout
- Previous / Next lesson navigation
- Mark as Complete button → fires LessonCompleted event
- Content type renderer: text | video | pdf | drive_file
- Google Drive: PDF embedded via iframe, MP4 via <video> player
- Notes panel: collapsible sidebar, auto-save on blur, synced to API

### PWA Setup
- next-pwa (Workbox) configured for lesson content caching
- Cache strategy: network-first with offline fallback for lesson page
- Add to Home Screen prompt for mobile users

### Tasks
- [ ] Write test: LessonCompleted event fires on Mark Complete click
- [ ] Write test: Notes auto-save debounces correctly
- [ ] Create LessonPlayer.tsx (content type switcher)
- [ ] Create DriveFileViewer.tsx (iframe for PDF, video for MP4)
- [ ] Create NotesPanel.tsx (collapsible, auto-save)
- [ ] Create /courses/[slug]/lessons/[lessonId]/page.tsx
- [ ] Configure next-pwa in next.config.ts
- [ ] Verify lesson loads when Chrome DevTools → offline mode
- [ ] All tests pass

### Acceptance Criteria
- Mark Complete fires LessonCompleted event to Redis
- Notes persist on refresh
- Drive PDF embeds render without auth errors (using Drive iframe embed URL)
- Lesson loads in offline mode after first visit
- Mobile layout: bottom nav, full-width video""",
        "priority": 3,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 11: Quiz Engine",
        "description": """## Quiz Engine — Assessment with IICRC-Standard Scoring

Multiple choice and true/false quiz engine. Questions randomised per attempt. Configurable pass percentage, time limits, and max attempts. Incorrect answers show explanation after submission. Results fire QuizPassed event on pass.

### Endpoints
- GET /api/v1/quizzes/{quiz_id} — fetch questions (randomised order, no correct answer flagged)
- POST /api/v1/quizzes/{quiz_id}/submit — submit answers, returns score, pass/fail, explanations
- GET /api/v1/quizzes/{quiz_id}/attempts — student's own attempts

### Frontend Components
- QuizPlayer.tsx — question-by-question or all-at-once display
- QuizTimer.tsx — countdown if time limit set
- QuizResult.tsx — score, pass/fail badge, per-question explanation

### Tasks
- [ ] Write failing test: submit correct answers, score = 100%, passed = true
- [ ] Write failing test: submit after max_attempts returns 429
- [ ] Write failing test: questions returned without is_correct field
- [ ] Implement quiz service (score calculation, attempt tracking)
- [ ] Implement quiz router
- [ ] Create QuizPlayer, QuizTimer, QuizResult components
- [ ] QuizPassed event fires on pass
- [ ] All tests pass

### Acceptance Criteria
- Questions served without revealing correct answers
- Score calculated as points_earned / total_points
- passed = score >= pass_percentage
- Max attempts enforced (429 on exceed)
- QuizPassed event fired → triggers CEC/certificate check""",
        "priority": 3,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 12: Instructor Dashboard & Course Builder",
        "description": """## Instructor Dashboard and Course Builder

Instructors create and manage courses via a drag-and-drop course builder. Modules and lessons can be reordered. Lessons attach content: text editor, video URL, or Google Drive file picker. Per-course student analytics shown.

### Pages
- /instructor/dashboard — courses list, completion rates
- /instructor/courses/new — create course form (title, IICRC discipline, CEC hours, CPP40421 unit)
- /instructor/courses/[slug]/edit — full course builder
- /instructor/courses/[slug]/students — student list with progress per student

### Course Builder Components
- CourseBuilder.tsx — module/lesson tree with drag-to-reorder
- ModuleEditor.tsx — add/edit/delete module
- LessonEditor.tsx — content type selector + editor
- DriveFilePicker.tsx — browse CARSI Google Drive folder, select file → attach to lesson
- IICRCFields.tsx — discipline selector, CEC hours input, CPP40421 unit lookup

### Tasks
- [ ] Write test: instructor can reorder lessons, order_index updates correctly
- [ ] Write test: DriveFilePicker lists files from /api/v1/drive/files
- [ ] Create all builder components
- [ ] Implement drag-to-reorder with @dnd-kit/core
- [ ] Create student analytics page with completion rate chart
- [ ] All tests pass

### Acceptance Criteria
- Instructors can create a full course with modules, lessons, and a quiz
- Drive file picker shows files from CARSI-LMS-Content folder
- IICRC discipline and CEC hours saved with course
- Student analytics shows per-student progress
- Only course owner can edit (others get 403)""",
        "priority": 3,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 13: Admin Panel",
        "description": """## Admin Panel

Platform administration: user management, role assignment, course approval workflow, platform-wide metrics (total students, CECs issued, completion rates by discipline).

### Pages
- /admin/dashboard — platform metrics overview
- /admin/users — all users, role assignment, account suspension
- /admin/courses — all courses, publish/unpublish, feature/unfeature

### Metrics Dashboard
- Total enrolled students
- Total IICRC CECs issued (all time + this year)
- Course completion rate by discipline
- Revenue (placeholder for payment phase)

### Tasks
- [ ] Write test: admin can change user role
- [ ] Write test: non-admin gets 403 on /admin endpoints
- [ ] Create admin router on backend with admin-only guard
- [ ] Create admin dashboard metrics endpoint
- [ ] Create all admin pages in Next.js
- [ ] All tests pass

### Acceptance Criteria
- Admin can suspend a user account (user cannot login while suspended)
- Admin can publish/unpublish any course
- Metrics dashboard shows correct totals from database
- All /admin routes return 403 for non-admin users""",
        "priority": 3,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 14: LinkedIn Share + Public Credential Verification",
        "description": """## LinkedIn Share & Public Credential Verification

Public-facing credential verification page. Students share their credential URL and anyone can verify it. LinkedIn share pre-fills the certification form with IICRC discipline, CARSI as issuer, CEC hours, and credential URL.

### Public Credential Page
URL: /credentials/{credential_id}
- No login required
- Shows: student name, course, IICRC discipline, CECs, date, valid/revoked status
- CARSI branding
- "Verify Credential" green/red status badge

### LinkedIn Share
- Button on CredentialCard in student dashboard
- Opens: https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&...
- Pre-fills: name={course} ({discipline}), organizationName=CARSI, issueYear, issueMonth, certUrl={credential_url}

### Tasks
- [ ] Write test: /credentials/{id} returns 200 with no auth
- [ ] Write test: /credentials/{invalid_id} returns 404
- [ ] Create public credential verification endpoint
- [ ] Create /credentials/[id]/page.tsx (public, Server Component)
- [ ] Create LinkedInShareButton.tsx component
- [ ] Verify LinkedIn URL opens with pre-filled fields in browser
- [ ] All tests pass

### Acceptance Criteria
- /credentials/{id} accessible without login
- Shows valid/revoked status
- LinkedIn button opens share form with all fields pre-filled
- Revoked credentials show clear "REVOKED" status on verification page""",
        "priority": 3,
        "labels": [FEATURE_LABEL_ID],
    },
    {
        "title": "Phase 15: Theme System + Mobile Polish",
        "description": """## Dark/Light Theme System + Mobile-First Polish

Dual theme system: Clean Professional (light, default) and Scientific Luxury (dark). Theme preference saved to user profile server-side. Mobile-first review pass: bottom nav, tap targets, PWA install prompt.

### Theme System
- Light mode default (white, CARSI brand colours, high contrast)
- Dark mode (OLED black, spectral accents from starter design system)
- ThemeToggle component in header
- Preference saved: PATCH /api/v1/users/me → { theme_preference: 'light' | 'dark' }
- Loaded server-side on page render (no flash of wrong theme)

### Mobile Polish
- Bottom navigation bar (Dashboard / Courses / Credentials / Profile)
- Minimum 44px tap targets on all interactive elements
- PWA install prompt on mobile after 2nd visit
- Test on 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)

### Tasks
- [ ] Add theme_preference column to users table (migration 002)
- [ ] Write test: ThemeToggle saves preference to API
- [ ] Create ThemeToggle component
- [ ] Configure Tailwind dark: variants
- [ ] Apply dark mode classes to all layouts and major components
- [ ] Create BottomNav.tsx for mobile
- [ ] Audit tap targets on lesson player, quiz, dashboard
- [ ] PWA install prompt component
- [ ] Cross-device testing checklist

### Acceptance Criteria
- Theme preference persists across sessions and devices
- No flash of wrong theme on page load
- All pages render correctly in both light and dark mode
- Bottom nav visible on mobile, hidden on desktop
- PWA installable on Android and iOS
- All tap targets >= 44px on mobile""",
        "priority": 4,
        "labels": [FEATURE_LABEL_ID],
    },
]


def run_query(query: str, variables: dict = None) -> dict:
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.linear.app/graphql",
        data=data,
        headers={
            "Authorization": API_KEY,
            "Content-Type": "application/json",
        },
    )

    # Note: On Windows, SSL revocation check may fail — use context to disable if needed
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP Error {e.code}: {body}")
        raise


CREATE_ISSUE = """
mutation CreateIssue($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue {
      id
      identifier
      title
      url
    }
  }
}
"""


def create_issue(phase: dict) -> dict:
    variables = {
        "input": {
            "teamId": TEAM_ID,
            "projectId": PROJECT_ID,
            "stateId": BACKLOG_STATE_ID,
            "title": phase["title"],
            "description": phase["description"],
            "priority": phase["priority"],
            "labelIds": phase["labels"],
        }
    }
    result = run_query(CREATE_ISSUE, variables)
    return result["data"]["issueCreate"]["issue"]


if __name__ == "__main__":
    import sys
    # Phases to skip (already created)
    skip_titles = {"Phase 0: Foundation Setup"}

    to_create = [p for p in PHASES if p["title"] not in skip_titles]
    print(f"Creating {len(to_create)} remaining issues in CARSI Linear project...")
    created = []
    for i, phase in enumerate(to_create):
        try:
            issue = create_issue(phase)
            created.append(issue)
            sys.stdout.buffer.write(
                f"  [OK] {issue['identifier']}: {issue['title']}\n".encode("utf-8")
            )
            sys.stdout.buffer.write(f"       {issue['url']}\n".encode("utf-8"))
            sys.stdout.buffer.flush()
        except Exception as e:
            sys.stdout.buffer.write(
                f"  [FAIL] Phase {i}: {e}\n".encode("utf-8")
            )
            sys.stdout.buffer.flush()

    print(f"\nDone: {len(created)}/{len(to_create)} issues created.")
    print("Linear Project: https://linear.app/g-pilot/project/carsi-20538e04ba27")
