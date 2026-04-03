import { NextRequest, NextResponse } from 'next/server';

import { getAdminSessionOrNull } from '@/lib/admin/admin-session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ detail: 'Database not configured' }, { status: 503 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const term = q.toLowerCase();
  try {
    const users = await prisma.lmsUser.findMany({
      where: {
        isActive: true,
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, email: true, fullName: true },
      take: 25,
      orderBy: { email: 'asc' },
    });
    return NextResponse.json({ users });
  } catch (e) {
    console.error('[admin/users/search]', e);
    return NextResponse.json({ detail: 'Search failed' }, { status: 500 });
  }
}
