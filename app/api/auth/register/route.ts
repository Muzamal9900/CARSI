import { NextRequest, NextResponse } from 'next/server';

import { signSessionToken } from '@/lib/auth/session-jwt';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const memberNumber =
      typeof body.iicrc_member_number === 'string' ? body.iicrc_member_number.trim() : undefined;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    const externalBackend =
      process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || process.env.BACKEND_URL?.trim();

    if (externalBackend) {
      const backendResponse = await fetch(
        `${externalBackend.replace(/\/$/, '')}/api/lms/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            role: 'student',
            iicrc_member_number: memberNumber || undefined,
          }),
        }
      );

      const data = await backendResponse.json().catch(() => ({}));
      if (!backendResponse.ok) {
        return NextResponse.json(
          { error: (data as { detail?: string }).detail || 'Registration failed' },
          { status: backendResponse.status }
        );
      }

      const accessToken = (data as { access_token?: string }).access_token;
      const userId = (data as { user_id?: string }).user_id || '';
      const role = (data as { role?: string }).role || 'student';

      const response = NextResponse.json({
        success: true,
        user: { id: userId, email, full_name: fullName, role },
      });

      if (accessToken) {
        const cookieOptions = {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
          maxAge: COOKIE_MAX_AGE,
        };
        response.cookies.set('auth_token', accessToken, { ...cookieOptions, httpOnly: true });
        response.cookies.set('carsi_token', accessToken, { ...cookieOptions, httpOnly: false });
      }

      return response;
    }

    // Local fallback mode (no external backend configured).
    const userId = crypto.randomUUID();
    const accessToken = await signSessionToken({
      sub: userId,
      email,
      full_name: fullName,
      role: 'student',
    });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email, full_name: fullName, role: 'student' },
    });

    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    };
    response.cookies.set('auth_token', accessToken, { ...cookieOptions, httpOnly: true });
    response.cookies.set('carsi_token', accessToken, { ...cookieOptions, httpOnly: false });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Registration service unavailable',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

