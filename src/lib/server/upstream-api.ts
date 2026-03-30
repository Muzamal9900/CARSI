import { NextResponse } from 'next/server';

/**
 * Legacy external HTTP API (FastAPI) proxy — removed; LMS data and auth use this app + Prisma.
 */
export function getUpstreamBaseUrl(): string | null {
  return null;
}

export function upstreamNotConfigured(): NextResponse {
  return NextResponse.json(
    { detail: 'This integration is not available in this deployment.' },
    { status: 503 }
  );
}
