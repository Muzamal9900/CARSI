import { NextRequest, NextResponse } from 'next/server';

import { verifySessionToken } from '@/lib/auth/session-jwt';
import { hasCompletedOnboarding, setOnboardingCompletedCookie } from '@/lib/auth/onboarding-cookie';
import type { User } from '@/lib/api/auth';
import { getUpstreamBaseUrl } from '@/lib/server/upstream-api';

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

  const user: User = {
    id: claims.sub,
    email: claims.email,
    full_name: claims.full_name,
    roles: [claims.role],
    theme_preference: 'dark',
    is_active: true,
    is_verified: true,
    onboarding_completed: hasCompletedOnboarding(request, claims.sub),
  };
  return NextResponse.json(user);
}

/**
 * Profile updates (e.g. theme). Proxies to upstream when BACKEND_URL is set.
 */
export async function PATCH(request: NextRequest) {
  const upstream = getUpstreamBaseUrl();
  if (upstream) {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.text();
    const url = `${upstream.replace(/\/$/, '')}/api/lms/auth/me`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        authorization: auth,
        'content-type': request.headers.get('content-type') || 'application/json',
      },
      body: body || undefined,
      cache: 'no-store',
    });
    const contentType = res.headers.get('content-type') || 'application/json';
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: res.status,
      headers: { 'content-type': contentType },
    });
  }

  const result = await requireClaims(request);
  if ('error' in result) return result.error;
  const { claims } = result;

  const patch = (await request.json().catch(() => ({}))) as Partial<User>;
  const theme_preference =
    typeof patch.theme_preference === 'string' ? patch.theme_preference : 'dark';

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
