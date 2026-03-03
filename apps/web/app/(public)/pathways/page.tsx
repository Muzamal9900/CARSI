import { LearningPathwayCard } from '@/components/lms/LearningPathwayCard';

interface Pathway {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  iicrc_discipline?: string | null;
  target_certification?: string | null;
  estimated_hours?: string | null;
}

async function getPathways(): Promise<{ items: Pathway[]; total: number }> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${backendUrl}/api/lms/pathways`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return { items: [], total: 0 };
    return res.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function PathwaysPage() {
  const { items: pathways, total } = await getPathways();

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold">Certification Pathways</h1>
      <p className="text-muted-foreground mb-8">
        Structured learning journeys towards IICRC certification.{' '}
        {total > 0 && `${total} pathway${total !== 1 ? 's' : ''} available.`}
      </p>

      {pathways.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pathways.map((p) => (
            <LearningPathwayCard key={p.id} pathway={p} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-12 text-center">
          No pathways published yet. Check back soon.
        </p>
      )}
    </main>
  );
}
