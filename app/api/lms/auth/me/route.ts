import { NextRequest, NextResponse } from 'next/server';

import type { User } from '@/lib/api/auth';
import { hasCompletedOnboarding, setOnboardingCompletedCookie } from '@/lib/auth/onboarding-cookie';
import { verifySessionToken } from '@/lib/auth/session-jwt';
import { prisma } from '@/lib/prisma';

async function requireClaims(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ detail: 'Unauthorized' }, { status: 401 }) };
  }
  const token = auth.slice(7);
  const claims = await verifySessionToken(token);
  if (!claims) {
    return { error: NextResponse.json({ detail: 'Invalid token' }, { status: 401 }) };
  }
  return { claims };
}

/**
 * LMS profile for apiClient.getCurrentUser — same JWT as /api/auth/login cookies.
 */
export async function GET(request: NextRequest) {
  const result = await requireClaims(request);
  if ('error' in result) return result.error;
  const { claims } = result;

  let theme_preference = 'dark';
  if (process.env.DATABASE_URL?.trim()) {
    const row = await prisma.lmsUser.findUnique({
      where: { id: claims.sub },
      select: { themePreference: true },
    });
    if (row?.themePreference) theme_preference = row.themePreference;
  }

  const user: User = {
    id: claims.sub,
    email: claims.email,
    full_name: claims.full_name,
    roles: [claims.role],
    theme_preference,
    is_active: true,
    is_verified: true,
    onboarding_completed: hasCompletedOnboarding(request, claims.sub),
  };
  return NextResponse.json(user);
}

/**
 * Profile updates (e.g. theme). Persisted on `lms_users` when DATABASE_URL is set.
 */
export async function PATCH(request: NextRequest) {
  const result = await requireClaims(request);
  if ('error' in result) return result.error;
  const { claims } = result;

  const patch = (await request.json().catch(() => ({}))) as Partial<User>;
  let theme_preference = 'dark';

  if (process.env.DATABASE_URL?.trim()) {
    const row = await prisma.lmsUser.findUnique({
      where: { id: claims.sub },
      select: { themePreference: true },
    });
    if (row?.themePreference) theme_preference = row.themePreference;
  }

  if (typeof patch.theme_preference === 'string') {
    theme_preference = patch.theme_preference;
    if (process.env.DATABASE_URL?.trim()) {
      try {
        await prisma.lmsUser.update({
          where: { id: claims.sub },
          data: { themePreference: patch.theme_preference },
        });
      } catch {
        // User row may not exist yet; still return cookie-backed profile.
      }
    }
  }

  const response = NextResponse.json({
    id: claims.sub,
    email: claims.email,
    full_name: claims.full_name,
    roles: [claims.role],
    theme_preference,
    is_active: true,
    is_verified: true,
    onboarding_completed:
      patch.onboarding_completed === true
        ? true
        : hasCompletedOnboarding(request, claims.sub),
  } satisfies User);
  if (patch.onboarding_completed === true) {
    setOnboardingCompletedCookie(response, claims.sub);
  }
  return response;
}
