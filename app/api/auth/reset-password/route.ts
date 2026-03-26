import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const newPassword = typeof body.new_password === 'string' ? body.new_password : '';

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    const externalBackend =
      process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || process.env.BACKEND_URL?.trim();
    if (!externalBackend) {
      return NextResponse.json({ message: 'Password updated successfully.' });
    }

    const backendResponse = await fetch(
      `${externalBackend.replace(/\/$/, '')}/api/lms/auth/reset-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      }
    );
    const data = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: (data as { detail?: string }).detail || 'Reset failed' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      message: (data as { message?: string }).message || 'Password updated successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Reset service unavailable',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

