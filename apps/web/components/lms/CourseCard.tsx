import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    slug: string;
    title: string;
    short_description?: string | null;
    price_aud: number | string;
    is_free?: boolean;
    level?: string | null;
    category?: string | null;
    discipline?: string | null;
    lesson_count?: number | null;
    thumbnail_url?: string | null;
    updated_at?: string | null;
    instructor?: { full_name: string } | null;
  };
}

// Discipline-specific gradient backgrounds as placeholders
const disciplineGradients: Record<string, string> = {
  WRT: 'from-blue-600 to-blue-800',
  CRT: 'from-teal-600 to-teal-800',
  ASD: 'from-indigo-600 to-indigo-800',
  OCT: 'from-purple-600 to-purple-800',
  CCT: 'from-cyan-600 to-cyan-800',
  FSRT: 'from-orange-600 to-red-700',
  AMRT: 'from-green-600 to-green-800',
};

function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  if (days < 30) return `Updated ${days} days ago`;
  const months = Math.floor(days / 30);
  return `Updated ${months} month${months > 1 ? 's' : ''} ago`;
}

export function CourseCard({ course }: CourseCardProps) {
  const priceNum =
    typeof course.price_aud === 'string' ? parseFloat(course.price_aud) : course.price_aud;
  const isFree = course.is_free || priceNum === 0;
  const price = isFree ? 'Free' : `$${priceNum.toFixed(0)} AUD`;

  const discipline =
    course.discipline ??
    (course.category?.match(/^(WRT|CRT|ASD|OCT|CCT|FSRT|AMRT)/)
      ? course.category.split(' ')[0]
      : null);

  const gradientClass =
    (discipline && disciplineGradients[discipline]) ?? 'from-blue-600 to-blue-800';

  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-[#E5E7EB] bg-white transition-shadow duration-200 hover:shadow-md">
      {/* Course image / placeholder */}
      <div className={`relative h-36 w-full overflow-hidden bg-gradient-to-br ${gradientClass}`}>
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-end p-3">
            {discipline && (
              <span className="font-mono text-xs font-semibold text-white/70">{discipline}</span>
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-3">
        {/* Badges */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {discipline && (
            <span className="inline-flex items-center rounded-sm bg-[#EFF6FF] px-2 py-0.5 text-xs font-semibold text-[#2490ed]">
              {discipline}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold ${
              isFree ? 'bg-[#F0FDF4] text-[#16a34a]' : 'bg-[#FFF7ED] text-[#ed9d24]'
            }`}
          >
            {price}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 flex-1 text-sm leading-snug font-semibold text-[#111827]">
          {course.title}
        </h3>

        {/* Meta */}
        <div className="mt-auto flex items-center justify-between border-t border-[#F3F4F6] pt-2">
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            {course.lesson_count != null && (
              <>
                <BookOpen className="h-3 w-3" />
                <span>{course.lesson_count} Lessons</span>
              </>
            )}
            {!course.lesson_count && course.updated_at && (
              <span>{formatRelativeDate(course.updated_at)}</span>
            )}
          </div>
          <Link
            href={`/courses/${course.slug}`}
            className="text-xs font-medium text-[#2490ed] hover:underline"
            aria-label={`View ${course.title}`}
          >
            View
          </Link>
        </div>

        {course.lesson_count != null && course.updated_at && (
          <p className="mt-1 text-[10px] text-[#9CA3AF]">{formatRelativeDate(course.updated_at)}</p>
        )}
      </div>
    </div>
  );
}
