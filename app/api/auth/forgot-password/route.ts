import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const externalBackend =
      process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || process.env.BACKEND_URL?.trim();
    if (!externalBackend) {
      return NextResponse.json({
        message: 'If that email exists, a password reset link has been sent.',
      });
    }

    const backendResponse = await fetch(
      `${externalBackend.replace(/\/$/, '')}/api/lms/auth/forgot-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }
    );
    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: (data as { detail?: string }).detail || 'Failed to send reset link' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      message:
        (data as { message?: string }).message ||
        'If that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Password reset service unavailable',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

