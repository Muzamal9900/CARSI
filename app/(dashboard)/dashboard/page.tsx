import type { Metadata } from 'next';
import Link from 'next/link';

import { ChatInterface } from '@/components/chat/chat-interface';
import { DashboardLearningSection } from '@/components/dashboard/DashboardLearningSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLearnerDashboardSummary } from '@/lib/server/learner-dashboard-data';
import { getServerSessionClaims } from '@/lib/server/session-server';
import { fetchTaskQueueStats } from '@/lib/server/task-queue-stats';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | CARSI Learning',
  description: 'Your learning overview, enrolments, and AI assistant.',
};

export default async function DashboardPage() {
  const claims = await getServerSessionClaims();
  const dbConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const summary = claims && dbConfigured ? await getLearnerDashboardSummary(claims.sub) : null;
  const enrolmentQueryFailed = Boolean(claims && dbConfigured && summary === null);
  const taskStats = await fetchTaskQueueStats();

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-4 md:p-6">
      <DashboardLearningSection
        claims={claims}
        summary={summary}
        dbConfigured={dbConfigured}
        enrolmentQueryFailed={enrolmentQueryFailed}
      />

      <div>
        <h2 className="mb-4 font-mono text-xs tracking-widest text-white/40 uppercase">
          Agent task queue
        </h2>
        <p className="mb-4 text-sm text-white/45">
          Live counts from your orchestration API when{' '}
          <code className="rounded bg-white/10 px-1 font-mono text-xs">BACKEND_URL</code> exposes{' '}
          <code className="rounded bg-white/10 px-1 font-mono text-xs">/api/tasks/stats/summary</code>
          .
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="border-white/[0.08] bg-white/[0.02]"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Total tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{taskStats.total_tasks}</div>
            </CardContent>
          </Card>
          <Card
            className="border-white/[0.08] bg-white/[0.02]"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{taskStats.pending}</div>
            </CardContent>
          </Card>
          <Card
            className="border-white/[0.08] bg-white/[0.02]"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">In progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{taskStats.in_progress}</div>
            </CardContent>
          </Card>
          <Card
            className="border-white/[0.08] bg-white/[0.02]"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">Completed / failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {taskStats.completed} / {taskStats.failed}
              </div>
            </CardContent>
          </Card>
        </div>
        <p className="mt-3">
          <Link
            href="/tasks"
            className="text-sm font-medium text-[#2490ed] transition hover:underline"
          >
            Open full task queue →
          </Link>
        </p>
      </div>

      <Card
        className="border-white/[0.08] bg-white/[0.02]"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <CardHeader>
          <CardTitle className="text-white">AI assistant</CardTitle>
          <CardDescription className="text-white/45">
            Ask questions about your training plan or course content (requires a configured chat
            backend).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatInterface />
        </CardContent>
      </Card>
    </div>
  );
}
