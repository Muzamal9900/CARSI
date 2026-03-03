import { CourseGrid } from '@/components/lms/CourseGrid';

interface SearchParams {
  category?: string;
  level?: string;
}

async function getCourses(category?: string, level?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (level) params.set('level', level);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${backendUrl}/api/lms/courses?${params}`, {
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
  const { category, level } = await searchParams;
  const { items: courses, total } = await getCourses(category, level);

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold">Restoration Training Courses</h1>
      <p className="text-muted-foreground mb-8">
        {total} course{total !== 1 ? 's' : ''} available
      </p>
      {courses.length > 0 ? (
        <CourseGrid courses={courses} />
      ) : (
        <p className="text-muted-foreground mt-12 text-center">
          No courses found. Check back soon.
        </p>
      )}
    </main>
  );
}
