import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, PlayCircle, Sparkles, Trophy } from 'lucide-react';

import type { SessionClaims } from '@/lib/auth/session-jwt';
import { EnrolledCourseList } from '@/components/lms/EnrolledCourseList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LearnerDashboardSummary } from '@/lib/server/learner-dashboard-data';

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof BookOpen;
}) {
  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03]"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-white/50 uppercase">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-[#2490ed] opacity-90" aria-hidden />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-white/40">{hint}</p> : null}
    </div>
  );
}

export function DashboardLearningSection({
  claims,
  summary,
  dbConfigured,
  enrolmentQueryFailed,
}: {
  claims: SessionClaims | null;
  summary: LearnerDashboardSummary | null;
  dbConfigured: boolean;
  enrolmentQueryFailed: boolean;
}) {
  const name = claims?.full_name?.split(' ')[0] ?? 'Learner';
  const total = summary?.counts.total ?? 0;
  const active = summary?.counts.active ?? 0;
  const completed = summary?.counts.completed ?? 0;
  const cec = summary?.cecHoursFromCompleted ?? 0;
  const catalogHours = summary?.totalCatalogHours ?? 0;
  const enrollments = summary?.enrollments ?? [];

  return (
    <div className="w-full max-w-none space-y-10">
      <header className="border-b border-white/[0.06] pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#2490ed]/90 uppercase">Overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-[2rem]">Welcome back, {name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
          Continue your training where you left off. Progress syncs as you complete lessons and assessments.
        </p>
      </header>

      {!dbConfigured ? (
        <div
          className="rounded-xl border px-4 py-3 text-sm text-amber-100/90"
          style={{
            background: 'rgba(245, 158, 11, 0.07)',
            borderColor: 'rgba(245, 158, 11, 0.22)',
          }}
        >
          Set <code className="rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-xs">DATABASE_URL</code> and run
          migrations to load enrolments. The catalogue still works without it.
        </div>
      ) : null}

      {enrolmentQueryFailed ? (
        <div
          className="rounded-xl border px-4 py-3 text-sm text-red-100/90"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.28)',
          }}
        >
          Could not load enrolments. Check the database connection and Prisma migrations.
        </div>
      ) : null}

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Learning statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Enrolled"
            value={total}
            hint="Active seats in your account"
            icon={BookOpen}
          />
          <StatCard label="In progress" value={active} hint="Started but not finished" icon={PlayCircle} />
          <StatCard label="Completed" value={completed} hint="Finished programs" icon={Trophy} />
          <StatCard
            label="CEC hours"
            value={cec > 0 ? cec.toFixed(1) : '—'}
            hint={
              catalogHours > 0
                ? `~${catalogHours.toFixed(0)}h catalog time across enrolments`
                : 'From completed courses'
            }
            icon={GraduationCap}
          />
        </div>
      </section>

      <section
        className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <p className="text-sm text-white/50">Jump to your tools</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2490ed] px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(36,144,237,0.25)] transition hover:bg-[#3a9ef5]"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            My learning
            <ArrowRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
          </Link>
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/[0.07]"
          >
            Browse courses
          </Link>
          <Link
            href="/dashboard/pathways"
            className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/[0.07]"
          >
            Pathways
          </Link>
        </div>
      </section>

      <Card
        className="overflow-hidden border-white/[0.08] bg-white/[0.02] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <CardHeader className="border-b border-white/[0.06] pb-4">
          <CardTitle className="text-lg text-white">Continue learning</CardTitle>
          <CardDescription className="text-white/45">
            {enrollments.length === 0
              ? 'No enrolments yet — browse the catalogue and enrol to see courses here.'
              : 'Resume lessons and track completion from your last session.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <EnrolledCourseList enrollments={enrollments} />
        </CardContent>
      </Card>
    </div>
  );
}
