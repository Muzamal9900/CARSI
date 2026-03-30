'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookOpen, Loader2, Trash2, UserRound } from 'lucide-react';

import type { AdminDashboardClientData, AdminUserProgress } from '@/lib/admin/admin-dashboard-data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProgressBar } from '@/components/lms/ProgressBar';

function panelStyle() {
  return { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
}

function completionColor(completionPct: number) {
  if (completionPct >= 90) return '#00FF88';
  if (completionPct >= 40) return '#2490ed';
  return '#ff9f43';
}

function AvatarIcon({ user }: { user: AdminUserProgress }) {
  const label = (user.fullName ?? user.email).split(' ').filter(Boolean)[0]?.slice(0, 1) ?? 'A';
  return (
    <div
      aria-hidden
      className="flex h-9 w-9 items-center justify-center rounded-sm"
      style={{
        background: 'rgba(36,144,237,0.12)',
        border: '1px solid rgba(36,144,237,0.25)',
        color: '#7ec5ff',
        fontWeight: 800,
      }}
    >
      {label.toUpperCase()}
    </div>
  );
}

const CHART_COLS = ['#2490ed', '#00F5FF', '#00FF88', '#ff9f43', '#a855f7', '#f472b6'];

export function AdminDashboardClient({ data }: { data: AdminDashboardClientData }) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(data.users[0]?.userId ?? null);
  const [courseSlugToAdd, setCourseSlugToAdd] = useState<string>('');
  const [pendingGrant, setPendingGrant] = useState(false);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selected = useMemo(
    () => data.users.find((u) => u.userId === selectedUserId) ?? null,
    [data.users, selectedUserId]
  );

  const enrolledSlugs = useMemo(
    () => new Set(selected?.enrollments.map((e) => e.courseSlug) ?? []),
    [selected]
  );

  const grantableCourses = useMemo(
    () => data.catalogCourses.filter((c) => !enrolledSlugs.has(c.slug)),
    [data.catalogCourses, enrolledSlugs]
  );

  const gaugeData = useMemo(() => {
    const pct = selected?.overallCompletionPct ?? 0;
    return [
      { name: 'done', value: pct },
      { name: 'rest', value: Math.max(0, 100 - pct) },
    ];
  }, [selected]);

  async function grantCourse() {
    setActionError(null);
    if (!selectedUserId || !courseSlugToAdd) return;
    setPendingGrant(true);
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedUserId, courseSlug: courseSlugToAdd }),
      });
      const payload = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) {
        setActionError(payload.detail ?? 'Could not add course');
        return;
      }
      setCourseSlugToAdd('');
      router.refresh();
    } finally {
      setPendingGrant(false);
    }
  }

  async function revokeEnrollment(enrollmentId: string) {
    setActionError(null);
    setPendingRevokeId(enrollmentId);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' });
      const payload = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) {
        setActionError(payload.detail ?? 'Could not remove course');
        return;
      }
      router.refresh();
    } finally {
      setPendingRevokeId(null);
    }
  }

  return (
    <div className="space-y-6 p-4 pb-16">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-white/50">
          Learners & enrollments · Seed catalog ({data.catalogMeta.totalCoursesInCatalog} courses)
        </p>
      </header>

      {actionError ? (
        <div
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          role="status"
        >
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Users', value: data.kpis.totalUsers, accent: '#7ec5ff' },
          { label: 'Active enrollments', value: data.kpis.activeLearners, accent: '#00F5FF' },
          { label: 'Completed', value: data.kpis.completedEnrollments, accent: '#00FF88' },
          { label: 'Completion rate', value: `${data.kpis.completionRatePct}%`, accent: '#2490ed' },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader style={panelStyle()} className="py-3">
              <CardTitle className="text-xs font-semibold tracking-wide text-white/55">{k.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold tabular-nums" style={{ color: k.accent }}>
                {typeof k.value === 'number' ? k.value.toLocaleString() : k.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white/80">Avg. completion by course</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.completionByCourseBar} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                <XAxis dataKey="courseTitle" tick={{ fill: '#ffffff88', fontSize: 9 }} interval={0} angle={-18} textAnchor="end" height={48} />
                <YAxis tick={{ fill: '#ffffff88' }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="completionPct" radius={[4, 4, 0, 0]}>
                  {data.charts.completionByCourseBar.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLS[idx % CHART_COLS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white/80">Enrollment status</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.statusPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {data.charts.statusPie.map((entry, idx) => (
                    <Cell key={entry.name} fill={entry.name === 'Completed' ? '#00FF88' : CHART_COLS[idx % CHART_COLS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white/80">Workbook categories (course count)</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.catalogCategoryPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  label={false}
                >
                  {data.charts.catalogCategoryPie.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLS[idx % CHART_COLS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white/80">Enrollments per course (top)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.charts.enrollmentsPerCourse}
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fill: '#ffffff88' }} />
                <YAxis type="category" dataKey="name" width={118} tick={{ fill: '#ffffff88', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#2490ed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white/80">Completions (14 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.completionsLine} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2490ed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2490ed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
                <XAxis dataKey="date" tick={{ fill: '#ffffff88', fontSize: 10 }} />
                <YAxis tick={{ fill: '#ffffff88' }} />
                <Tooltip />
                <Area type="monotone" dataKey="completions" stroke="#2490ed" fillOpacity={1} fill="url(#adminArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white/80">Learner</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {selected ? (
              <>
                <div className="relative h-[160px] w-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={72}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        <Cell fill="#2490ed" />
                        <Cell fill="rgba(255,255,255,0.08)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-black tabular-nums" style={{ color: completionColor(selected.overallCompletionPct) }}>
                      {selected.overallCompletionPct}%
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">overall</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white/90">{selected.fullName ?? selected.email}</div>
                  <div className="text-xs text-white/45">{selected.email}</div>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/45">Select a user</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white/80">Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((u) => (
                  <TableRow
                    key={u.userId}
                    onClick={() => setSelectedUserId(u.userId)}
                    className="cursor-pointer"
                    style={{
                      background: selectedUserId === u.userId ? 'rgba(36,144,237,0.12)' : undefined,
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AvatarIcon user={u} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white/90">{u.fullName ?? u.email}</div>
                          <div className="truncate text-xs text-white/45">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums" style={{ color: completionColor(u.overallCompletionPct) }}>
                      {u.overallCompletionPct}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <BookOpen className="h-4 w-4 text-[#2490ed]" />
              Seed catalog courses for this user
            </CardTitle>
            {selected ? (
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Add course</div>
                  <Select
                    value={courseSlugToAdd}
                    onValueChange={setCourseSlugToAdd}
                    disabled={grantableCourses.length === 0 || !selected}
                  >
                    <SelectTrigger className="border-white/10 bg-white/[0.03]">
                      <SelectValue placeholder={grantableCourses.length ? 'Choose course…' : 'All workbook courses assigned'} />
                    </SelectTrigger>
                    <SelectContent>
                      {grantableCourses.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.title} ({c.moduleCount} modules)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  className="shrink-0"
                  disabled={!courseSlugToAdd || pendingGrant || !selected}
                  onClick={() => void grantCourse()}
                >
                  {pendingGrant ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="max-h-[480px] space-y-4 overflow-y-auto pr-1">
            {selected ? (
              selected.enrollments.length > 0 ? (
                selected.enrollments.map((e) => (
                  <div
                    key={e.enrollmentId}
                    className="rounded-lg border border-white/[0.08] p-4"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-white/90">{e.courseTitle}</div>
                        <div className="mt-1 text-xs text-white/45">
                          {e.completedLessons}/{e.totalLessons} lessons · {e.completedModules} modules done
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold tabular-nums" style={{ color: completionColor(e.completionPct) }}>
                          {e.completionPct}%
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 shrink-0"
                          disabled={pendingRevokeId === e.enrollmentId}
                          onClick={() => void revokeEnrollment(e.enrollmentId)}
                          title="Remove access"
                        >
                          {pendingRevokeId === e.enrollmentId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar percentage={e.completionPct} label="Completion" />
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {e.modules.map((m) => (
                        <div
                          key={m.moduleNo}
                          className="rounded-md border p-2.5 text-xs"
                          style={{
                            background: m.completed ? 'rgba(0,255,136,0.07)' : 'rgba(255,255,255,0.02)',
                            borderColor: m.completed ? 'rgba(0,255,136,0.22)' : 'rgba(255,255,255,0.08)',
                          }}
                        >
                          <div className="font-medium text-white/85">{m.title}</div>
                          <div className="text-white/45">Mod {m.moduleNo}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-white/45">
                  <UserRound className="h-10 w-10 opacity-40" />
                  <p className="text-sm">No workbook enrollments yet. Add a course above.</p>
                </div>
              )
            ) : (
              <p className="text-sm text-white/45">Select a user from the directory.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
