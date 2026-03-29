import { prisma } from '@/lib/prisma';

/** Client / API shape for `EnrolledCourseList` and enrollments/me. */
export interface EnrollmentDto {
  id: string;
  course_id: string;
  course_title: string;
  course_slug: string;
  status: string;
  enrolled_at: string;
  completion_percentage: number;
}

export interface LearnerDashboardSummary {
  enrollments: EnrollmentDto[];
  counts: {
    total: number;
    active: number;
    completed: number;
  };
  /** Sum of `cecHours` on courses the learner has completed (when set on course rows). */
  cecHoursFromCompleted: number;
  /** Sum of `durationHours` across all enrolled courses (catalog metadata). */
  totalCatalogHours: number;
}

function normalizeStatus(raw: string): 'completed' | 'active' | 'other' {
  const s = raw.toLowerCase().trim();
  if (s === 'completed' || s === 'complete') return 'completed';
  if (
    s === 'active' ||
    s === 'enrolled' ||
    s === 'in_progress' ||
    s === 'in progress' ||
    s === 'started'
  ) {
    return 'active';
  }
  return 'other';
}

function completionPercentage(status: string): number {
  const n = normalizeStatus(status);
  if (n === 'completed') return 100;
  if (n === 'active') return 12;
  return 0;
}

function mapRow(e: {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  enrolledAt: Date;
  course: {
    title: string;
    slug: string;
    cecHours: unknown;
    durationHours: unknown;
  };
}): EnrollmentDto {
  return {
    id: e.id,
    course_id: e.courseId,
    course_title: e.course.title,
    course_slug: e.course.slug,
    status: e.status,
    enrolled_at: e.enrolledAt.toISOString(),
    completion_percentage: completionPercentage(e.status),
  };
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'object' && v !== null && 'toString' in v) {
    const n = Number(String((v as { toString: () => string }).toString()));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getEnrollmentsForStudent(userId: string): Promise<EnrollmentDto[]> {
  const summary = await getLearnerDashboardSummary(userId);
  return summary?.enrollments ?? [];
}

export async function getLearnerDashboardSummary(
  userId: string
): Promise<LearnerDashboardSummary | null> {
  if (!process.env.DATABASE_URL?.trim()) {
    return null;
  }

  try {
    const rows = await prisma.lmsEnrollment.findMany({
      where: { studentId: userId },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
            cecHours: true,
            durationHours: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const enrollments = rows.map(mapRow);

    let active = 0;
    let completed = 0;
    let cecHoursFromCompleted = 0;
    let totalCatalogHours = 0;

    for (const r of rows) {
      const n = normalizeStatus(r.status);
      if (n === 'completed') {
        completed += 1;
        const cec = toNumber(r.course.cecHours);
        if (cec !== null) cecHoursFromCompleted += cec;
      } else if (n === 'active') {
        active += 1;
      }
      const dur = toNumber(r.course.durationHours);
      if (dur !== null) totalCatalogHours += dur;
    }

    return {
      enrollments,
      counts: {
        total: rows.length,
        active,
        completed,
      },
      cecHoursFromCompleted,
      totalCatalogHours,
    };
  } catch (err) {
    console.error('[learner-dashboard-data]', err);
    return null;
  }
}
