import type { DiscountType, UserDiscount } from '@/generated/prisma/client';

import { prisma } from '@/lib/prisma';

export type { DiscountType };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isDiscountRowActive(row: {
  isActive: boolean;
  expiryDate: Date | null;
}): boolean {
  if (!row.isActive) return false;
  if (row.expiryDate && row.expiryDate.getTime() <= Date.now()) return false;
  return true;
}

/**
 * Final price in AUD after applying an active discount. `listAud` is the catalogue list price.
 */
export function computeDiscountedAud(listAud: number, row: UserDiscount): number {
  const list = Number.isFinite(listAud) && listAud >= 0 ? listAud : 0;
  if (!isDiscountRowActive(row)) return list;

  const t = row.discountType;
  const raw = row.discountValue;

  switch (t) {
    case 'free':
      return 0;
    case 'percentage': {
      const pct = Number(raw ?? 0);
      if (!Number.isFinite(pct) || pct <= 0) return list;
      const capped = Math.min(100, Math.max(0, pct));
      return round2(list * (1 - capped / 100));
    }
    case 'flat': {
      const off = Number(raw ?? 0);
      if (!Number.isFinite(off) || off <= 0) return list;
      return round2(Math.max(0, list - off));
    }
    case 'custom': {
      const price = Number(raw ?? 0);
      if (!Number.isFinite(price) || price < 0) return list;
      return round2(price);
    }
    default:
      return list;
  }
}

/** Stripe Checkout requires at least A$0.50 for card payments (50 cents). */
export const STRIPE_MIN_UNIT_AMOUNT_CENTS = 50;

export function audToUnitCents(aud: number): number {
  return Math.round(aud * 100);
}

/**
 * Latest active, non-expired discount for this user+course (if any).
 */
export async function findActiveUserDiscount(
  userId: string,
  courseId: string
): Promise<UserDiscount | null> {
  const rows = await prisma.userDiscount.findMany({
    where: {
      userId,
      courseId,
      isActive: true,
      OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  const row = rows[0];
  if (!row) return null;
  return isDiscountRowActive(row) ? row : null;
}

export function describeDiscount(row: UserDiscount, listAud: number, finalAud: number): string {
  const list = round2(listAud);
  const fin = round2(finalAud);
  switch (row.discountType) {
    case 'free':
      return 'Free access';
    case 'percentage':
      return `${Number(row.discountValue ?? 0)}% off (${list} → ${fin} AUD)`;
    case 'flat':
      return `${Number(row.discountValue ?? 0)} AUD off (${list} → ${fin} AUD)`;
    case 'custom':
      return `Custom price ${fin} AUD (was ${list} AUD)`;
    default:
      return 'Discount';
  }
}
