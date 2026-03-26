import { NextRequest, NextResponse } from 'next/server';

import { signSessionToken, verifySessionToken } from '@/lib/auth/session-jwt';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  const currentToken = request.cookies.get('auth_token')?.value;
  if (!currentToken) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }

  const cookieOptions = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };

  const externalBackend =
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || process.env.BACKEND_URL?.trim();

  if (externalBackend) {
    try {
      const backendResponse = await fetch(
        `${externalBackend.replace(/\/$/, '')}/api/lms/auth/refresh`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        }
      );
      const data = await backendResponse.json().catch(() => ({}));
      if (backendResponse.ok && (data as { access_token?: string }).access_token) {
        const nextToken = (data as { access_token: string }).access_token;
        const response = NextResponse.json({ success: true });
        response.cookies.set('auth_token', nextToken, { ...cookieOptions, httpOnly: true });
        response.cookies.set('carsi_token', nextToken, { ...cookieOptions, httpOnly: false });
        return response;
      }
    } catch {
      // Fall through to local claim refresh attempt.
    }
  }

  const claims = await verifySessionToken(currentToken);
  if (!claims) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const refreshed = await signSessionToken({
    sub: claims.sub,
    email: claims.email,
    full_name: claims.full_name,
    role: claims.role,
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', refreshed, { ...cookieOptions, httpOnly: true });
  response.cookies.set('carsi_token', refreshed, { ...cookieOptions, httpOnly: false });
  return response;
}

