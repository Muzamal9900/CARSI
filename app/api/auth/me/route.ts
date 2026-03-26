import { NextRequest, NextResponse } from 'next/server';

import { verifySessionToken } from '@/lib/auth/session-jwt';

/**
 * Validates Bearer JWT for proxy.ts / middleware (starter template).
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const cookieToken = request.cookies.get('auth_token')?.value;
  const token = bearer || cookieToken;
  if (!token) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const claims = await verifySessionToken(token);
  if (!claims) {
    const externalBackend =
      process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || process.env.BACKEND_URL?.trim();
    if (!externalBackend) {
      return NextResponse.json({ detail: 'Invalid token' }, { status: 401 });
    }

    try {
      const backendResponse = await fetch(`${externalBackend.replace(/\/$/, '')}/api/lms/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await backendResponse.json().catch(() => ({}));
      if (!backendResponse.ok) {
        return NextResponse.json({ detail: 'Invalid token' }, { status: 401 });
      }

      return NextResponse.json({
        id: (data as { id?: string; user_id?: string }).id ?? (data as { user_id?: string }).user_id,
        email: (data as { email?: string }).email ?? '',
        full_name: (data as { full_name?: string }).full_name ?? 'User',
        roles:
          (data as { roles?: string[]; role?: string }).roles ??
          [(data as { role?: string }).role ?? 'student'],
        theme_preference: (data as { theme_preference?: string }).theme_preference ?? 'dark',
        is_active: (data as { is_active?: boolean }).is_active ?? true,
        is_verified: (data as { is_verified?: boolean }).is_verified ?? true,
      });
    } catch {
      return NextResponse.json({ detail: 'Invalid token' }, { status: 401 });
    }
  }
  return NextResponse.json({
    id: claims.sub,
    email: claims.email,
    full_name: claims.full_name,
    roles: [claims.role],
    theme_preference: 'dark',
    is_active: true,
    is_verified: true,
  });
}
