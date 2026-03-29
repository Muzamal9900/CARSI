import type { NextRequest, NextResponse } from 'next/server';

export const ONBOARDING_COOKIE = 'carsi_onboarding_completed';

export function setOnboardingCompletedCookie(response: NextResponse, userId: string): void {
  response.cookies.set(ONBOARDING_COOKIE, userId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export function hasCompletedOnboarding(request: NextRequest, userId: string): boolean {
  return request.cookies.get(ONBOARDING_COOKIE)?.value === userId;
}
