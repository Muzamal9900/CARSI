import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

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
    thumbnail_url?: string | null;
    instructor?: { full_name: string } | null;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const priceNum =
    typeof course.price_aud === 'string' ? parseFloat(course.price_aud) : course.price_aud;
  const price = course.is_free || priceNum === 0 ? 'Free' : `$${priceNum.toFixed(2)}`;

  return (
    <Card variant="interactive" className="flex flex-col">
      <Link href={`/courses/${course.slug}`} className="flex flex-1 flex-col">
        <div className="bg-muted relative h-48 w-full overflow-hidden rounded-t-xl">
          {course.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              No preview
            </div>
          )}
        </div>
        <CardContent className="flex-1 p-4">
          <h3 className="mb-2 text-lg leading-tight font-semibold">{course.title}</h3>
          {course.short_description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">{course.short_description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {course.level && <Badge variant="outline">{course.level}</Badge>}
            {course.category && <Badge variant="secondary">{course.category}</Badge>}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <span className="text-muted-foreground text-sm">{course.instructor?.full_name}</span>
          <span className="text-lg font-bold">{price}</span>
        </CardFooter>
      </Link>
    </Card>
  );
}
