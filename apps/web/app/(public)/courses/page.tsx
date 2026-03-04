import { CourseGrid } from '@/components/lms/CourseGrid';

interface SearchParams {
  category?: string;
  level?: string;
  discipline?: string;
}

async function getCourses() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${backendUrl}/api/lms/courses`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { items: [], total: 0 };
    return res.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { discipline } = await searchParams;
  const { items: courses, total } = await getCourses();

  return (
    <main className="relative min-h-screen" style={{ background: '#060a14' }}>
      {/* Mesh background */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            Restoration Training Courses
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {total} course{total !== 1 ? 's' : ''} across 7 IICRC disciplines
          </p>
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <CourseGrid courses={courses} initialTab={discipline ?? 'All'} />
        </div>
      </div>
    </main>
  );
}
