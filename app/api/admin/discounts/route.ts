import { NextRequest, NextResponse } from 'next/server';

import {
  createUserDiscounts,
  getAdminDiscountStats,
  listAdminDiscounts,
} from '@/lib/admin/admin-discounts-service';
import { getAdminSessionOrNull } from '@/lib/admin/admin-session';
import type { DiscountType } from '@/generated/prisma/client';

const TYPES = new Set(['percentage', 'flat', 'free', 'custom']);

export async function GET() {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ detail: 'Database not configured' }, { status: 503 });
  }
  try {
    const [stats, discounts] = await Promise.all([getAdminDiscountStats(), listAdminDiscounts()]);
    return NextResponse.json({ stats, discounts });
  } catch (e) {
    console.error('[admin/discounts GET]', e);
    return NextResponse.json({ detail: 'Failed to load discounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ detail: 'Database not configured' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    userIds?: unknown;
    courseIds?: unknown;
    discountType?: unknown;
    discountValue?: unknown;
    expiryDate?: unknown;
    note?: unknown;
  };

  const userIds = Array.isArray(body.userIds)
    ? body.userIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  const courseIds = Array.isArray(body.courseIds)
    ? body.courseIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  const discountType = typeof body.discountType === 'string' ? body.discountType : '';
  if (!TYPES.has(discountType)) {
    return NextResponse.json({ detail: 'Invalid discount_type' }, { status: 400 });
  }

  let discountValue: number | null = null;
  if (body.discountValue !== null && body.discountValue !== undefined) {
    if (typeof body.discountValue === 'number' && Number.isFinite(body.discountValue)) {
      discountValue = body.discountValue;
    } else if (typeof body.discountValue === 'string' && body.discountValue.trim()) {
      discountValue = Number.parseFloat(body.discountValue);
    }
  }

  let expiryDate: Date | null = null;
  if (typeof body.expiryDate === 'string' && body.expiryDate.trim()) {
    const d = new Date(body.expiryDate);
    if (!Number.isNaN(d.getTime())) expiryDate = d;
  }

  const note = typeof body.note === 'string' ? body.note : null;

  try {
    const result = await createUserDiscounts({
      userIds,
      courseIds,
      discountType: discountType as DiscountType,
      discountValue,
      expiryDate,
      note,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Create failed';
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
