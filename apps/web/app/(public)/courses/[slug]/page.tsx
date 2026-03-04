import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EnrolButton } from '@/components/lms/EnrolButton';

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  short_description?: string | null;
  price_aud: string;
  is_free: boolean;
  level?: string | null;
  category?: string | null;
  iicrc_discipline?: string | null;
  cec_hours?: string | null;
  duration_hours?: string | null;
  thumbnail_url?: string | null;
  instructor?: { full_name: string } | null;
}

async function getCourse(slug: string): Promise<CourseDetail | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${backendUrl}/api/lms/courses/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) notFound();

  const priceNum = parseFloat(course.price_aud);
  const price = course.is_free || priceNum === 0 ? 'Free' : `$${priceNum.toFixed(2)}`;

  return (
    <main className="container mx-auto px-4 py-12">
      <Link
        href="/courses"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center text-sm"
      >
        ← Back to courses
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-2">
            {course.level && <Badge variant="outline">{course.level}</Badge>}
            {course.category && <Badge variant="secondary">{course.category}</Badge>}
            {course.iicrc_discipline && (
              <Badge variant="default">IICRC {course.iicrc_discipline}</Badge>
            )}
          </div>

          <h1 className="mb-4 text-4xl font-bold">{course.title}</h1>

          {course.instructor && (
            <p className="text-muted-foreground mb-4">Instructor: {course.instructor.full_name}</p>
          )}

          {course.description && (
            <div className="prose prose-gray max-w-none">
              <p className="text-base leading-relaxed">{course.description}</p>
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 text-3xl font-bold">{price}</div>

              {course.duration_hours && (
                <p className="text-muted-foreground mb-2 text-sm">
                  Duration: {course.duration_hours} hours
                </p>
              )}

              {course.cec_hours && (
                <p className="text-muted-foreground mb-2 text-sm">CECs: {course.cec_hours} hours</p>
              )}

              <div className="mt-4">
                <EnrolButton
                  slug={course.slug}
                  priceAud={parseFloat(course.price_aud)}
                  isFree={course.is_free}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
