import { randomUUID } from 'node:crypto';

import type { DiscountType } from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';

import { prisma } from '@/lib/prisma';
import { computeDiscountedAud, describeDiscount, isDiscountRowActive } from '@/lib/server/user-discounts';

export type AdminDiscountRow = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  listPriceAud: number;
  discountType: DiscountType;
  discountValue: number | null;
  finalAud: number;
  expiryDate: string | null;
  note: string | null;
  /** Effective at checkout (not expired, is_active). */
  isEffective: boolean;
  /** DB flag — revoke only when true. */
  canRevoke: boolean;
  createdAt: string;
  description: string;
};

export type AdminDiscountStats = {
  activeCount: number;
  freeGrants: number;
  usersWithActiveDiscounts: number;
};

function num(d: Prisma.Decimal | null | undefined): number | null {
  if (d === null || d === undefined) return null;
  const n = Number(d);
  return Number.isFinite(n) ? n : null;
}

export async function getAdminDiscountStats(): Promise<AdminDiscountStats> {
  const now = new Date();
  const active = await prisma.userDiscount.findMany({
    where: {
      isActive: true,
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
    select: { userId: true, discountType: true },
  });

  const userSet = new Set<string>();
  let freeGrants = 0;
  for (const r of active) {
    userSet.add(r.userId);
    if (r.discountType === 'free') freeGrants += 1;
  }

  return {
    activeCount: active.length,
    freeGrants,
    usersWithActiveDiscounts: userSet.size,
  };
}

export async function listAdminDiscounts(): Promise<AdminDiscountRow[]> {
  const rows = await prisma.userDiscount.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, fullName: true } },
      course: { select: { slug: true, title: true, priceAud: true, isFree: true } },
    },
  });

  return rows.map((r) => {
    const list = Number(r.course.priceAud);
    const finalAud = computeDiscountedAud(list, r);
    return {
      id: r.id,
      userId: r.userId,
      userEmail: r.user.email,
      userName: r.user.fullName,
      courseId: r.courseId,
      courseSlug: r.course.slug,
      courseTitle: r.course.title,
      listPriceAud: list,
      discountType: r.discountType,
      discountValue: num(r.discountValue),
      finalAud,
      expiryDate: r.expiryDate?.toISOString() ?? null,
      note: r.note,
      isEffective: isDiscountRowActive(r),
      canRevoke: r.isActive,
      createdAt: r.createdAt.toISOString(),
      description: describeDiscount(r, list, finalAud),
    };
  });
}

export type CreateDiscountInput = {
  userIds: string[];
  courseIds: string[];
  discountType: DiscountType;
  discountValue: number | null;
  expiryDate: Date | null;
  note: string | null;
};

function validateInput(input: CreateDiscountInput): string | null {
  const { discountType, discountValue } = input;
  if (input.userIds.length === 0 || input.courseIds.length === 0) {
    return 'Select at least one user and one course';
  }
  switch (discountType) {
    case 'free':
      if (discountValue != null) return 'Free discounts should not include a value';
      break;
    case 'percentage': {
      const v = discountValue ?? NaN;
      if (!Number.isFinite(v) || v <= 0 || v > 100) return 'Percentage must be between 0 and 100';
      break;
    }
    case 'flat': {
      const v = discountValue ?? NaN;
      if (!Number.isFinite(v) || v <= 0) return 'Fixed amount must be greater than zero';
      break;
    }
    case 'custom': {
      const v = discountValue ?? NaN;
      if (!Number.isFinite(v) || v < 0) return 'Custom price must be zero or positive';
      break;
    }
    default:
      return 'Invalid discount type';
  }
  return null;
}

/**
 * Creates one row per user×course. Deactivates prior active rows for the same pair.
 */
export async function createUserDiscounts(input: CreateDiscountInput): Promise<{ created: number }> {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const valueDec =
    input.discountType === 'free'
      ? null
      : input.discountValue != null && Number.isFinite(input.discountValue)
        ? new Prisma.Decimal(input.discountValue)
        : null;

  let created = 0;
  await prisma.$transaction(async (tx) => {
    for (const userId of input.userIds) {
      for (const courseId of input.courseIds) {
        await tx.userDiscount.updateMany({
          where: { userId, courseId, isActive: true },
          data: { isActive: false },
        });

        await tx.userDiscount.create({
          data: {
            id: randomUUID(),
            userId,
            courseId,
            discountType: input.discountType,
            discountValue: valueDec,
            expiryDate: input.expiryDate,
            note: input.note?.trim() || null,
            isActive: true,
          },
        });
        created += 1;
      }
    }
  });

  return { created };
}

export async function revokeDiscount(id: string): Promise<void> {
  await prisma.userDiscount.update({
    where: { id },
    data: { isActive: false },
  });
}
