'use client';

import { useEffect, useState } from 'react';
import { XPLevelBadge } from '@/components/lms/XPLevelBadge';
import { StreakTracker } from '@/components/lms/StreakTracker';
import { CECProgressRing } from '@/components/lms/CECProgressRing';
import { IICRCIdentityCard } from '@/components/lms/IICRCIdentityCard';
import { SubscriptionStatus } from '@/components/lms/SubscriptionStatus';
import { EnrolledCourseList } from '@/components/lms/EnrolledCourseList';

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

function getUserId(): string {
  return typeof window !== 'undefined' ? (localStorage.getItem('carsi_user_id') ?? '') : '';
}

function authHeaders(): Record<string, string> {
  const id = getUserId();
  return id ? { 'X-User-Id': id } : {};
}

interface LevelData {
  total_xp: number;
  current_level: number;
  level_title: string;
  current_streak: number;
  longest_streak: number;
  xp_to_next_level: number | null;
}

interface SubData {
  has_subscription: boolean;
  status: string | null;
  plan: string | null;
  current_period_end: string | null;
  trial_end: string | null;
}

interface ProfileData {
  full_name: string;
  email: string;
  iicrc_member_number: string | null;
  iicrc_card_image_url: string | null;
  iicrc_expiry_date: string | null;
  iicrc_certifications: Array<{ discipline: string; certified_at: string }> | null;
}

interface Enrollment {
  id: string;
  course_id: string;
  course_title: string;
  course_slug: string;
  status: string;
  enrolled_at: string;
  completion_percentage: number;
}

export default function StudentDashboardPage() {
  const [level, setLevel] = useState<LevelData | null>(null);
  const [sub, setSub] = useState<SubData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  useEffect(() => {
    const headers = authHeaders();
    if (!headers['X-User-Id']) return;

    fetch(`${API}/api/lms/gamification/me/level`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then(setLevel)
      .catch(() => null);

    fetch(`${API}/api/lms/subscription/status`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then(setSub)
      .catch(() => null);

    fetch(`${API}/api/lms/auth/me`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .catch(() => null);

    fetch(`${API}/api/lms/enrollments/me`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEnrollments)
      .catch(() => [])
      .finally(() => setEnrollmentsLoading(false));
  }, []);

  function handleManageSubscription() {
    const headers = authHeaders();
    fetch(`${API}/api/lms/subscription/portal`, { method: 'POST', headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) window.location.href = data.url;
      })
      .catch(() => null);
  }

  function handleSubscribe() {
    window.location.href = '/subscribe';
  }

  const certifications = profile?.iicrc_certifications ?? [];

  return (
    <div className="flex max-w-4xl flex-col gap-8 p-6">
      <h1 className="font-mono text-2xl font-bold text-white">
        {profile?.full_name ?? 'My Dashboard'}
      </h1>

      {/* --- Professional Identity Row --- */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* IICRC Identity Card */}
        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-xs tracking-widest text-white/40 uppercase">
            IICRC Identity
          </h2>
          <IICRCIdentityCard
            memberNumber={profile?.iicrc_member_number}
            cardImageUrl={profile?.iicrc_card_image_url}
            expiryDate={profile?.iicrc_expiry_date}
            certifications={certifications}
          />
        </div>

        {/* CEC Progress */}
        {profile?.iicrc_member_number && (
          <div className="flex flex-col items-center gap-3">
            <h2 className="self-start font-mono text-xs tracking-widest text-white/40 uppercase">
              CEC Progress
            </h2>
            <CECProgressRing
              cecEarned={0}
              cecRequired={8}
              discipline={certifications[0]?.discipline}
            />
          </div>
        )}
      </section>

      {/* --- XP + Streak Row --- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs tracking-widest text-white/40 uppercase">
          Progress &amp; Streak
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          {level ? (
            <>
              <XPLevelBadge
                totalXp={level.total_xp}
                currentLevel={level.current_level}
                levelTitle={level.level_title}
                xpToNextLevel={level.xp_to_next_level}
              />
              <StreakTracker
                currentStreak={level.current_streak}
                longestStreak={level.longest_streak}
              />
            </>
          ) : (
            <p className="text-sm text-white/30">Loading…</p>
          )}
        </div>
      </section>

      {/* --- Subscription Status --- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs tracking-widest text-white/40 uppercase">Subscription</h2>
        <SubscriptionStatus
          status={
            sub?.has_subscription
              ? (sub.status as 'trialling' | 'active' | 'past_due' | 'cancelled' | 'unpaid')
              : null
          }
          trialEnd={sub?.trial_end}
          periodEnd={sub?.current_period_end}
          onManage={sub?.has_subscription ? handleManageSubscription : undefined}
          onSubscribe={!sub?.has_subscription ? handleSubscribe : undefined}
        />
      </section>

      {/* --- Enrolled Courses --- */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs tracking-widest text-white/40 uppercase">My Courses</h2>
        {enrollmentsLoading ? (
          <p className="text-sm text-white/30">Loading courses…</p>
        ) : (
          <EnrolledCourseList enrollments={enrollments} />
        )}
      </section>
    </div>
  );
}
