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
    <main className="min-h-screen bg-[#F3F4F6]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Restoration Training Courses</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            {total} course{total !== 1 ? 's' : ''} across 7 IICRC disciplines
          </p>
        </div>

        <div className="rounded-sm border border-[#E5E7EB] bg-white p-5">
          <CourseGrid courses={courses} initialTab={discipline ?? 'All'} />
        </div>
      </div>
    </main>
  );
}
