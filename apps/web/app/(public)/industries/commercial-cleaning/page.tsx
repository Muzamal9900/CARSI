import Link from 'next/link';
import { ArrowRight, Shield, Sparkles, Award } from 'lucide-react';
import { CourseGrid } from '@/components/lms/CourseGrid';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getIndustryCourses() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
  try {
    const [crtRes, cctRes] = await Promise.all([
      fetch(`${backendUrl}/api/lms/courses?discipline=CRT&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=CCT&limit=8`, { next: { revalidate: 60 } }),
    ]);

    const crtData = crtRes.ok ? await crtRes.json() : { items: [] };
    const cctData = cctRes.ok ? await cctRes.json() : { items: [] };

    const crtCourses = crtData.items ?? crtData ?? [];
    const cctCourses = cctData.items ?? cctData ?? [];

    const seen = new Set<string>();
    const combined = [];
    for (const c of [...crtCourses, ...cctCourses]) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        combined.push(c);
      }
    }
    return combined;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GlassStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="rounded-xl px-5 py-4 text-center"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <p className="text-gradient font-display text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </p>
    </div>
  );
}

function DisciplinePill({ code, label, color }: { code: string; label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs font-bold"
      style={{
        color,
        background: `${color}15`,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      {code} — {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CommercialCleaningIndustryPage() {
  const courses = await getIndustryCourses();

  return (
    <main className="relative min-h-screen" style={{ background: '#060a14' }}>
      {/* Mesh background */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
          <div className="animate-slide-up">
            {/* Industry pill */}
            <div
              className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: 'rgba(23,184,212,0.12)',
                border: '1px solid rgba(23,184,212,0.3)',
                color: '#17b8d4',
                boxShadow: '0 0 12px rgba(23,184,212,0.1)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Commercial Cleaning
            </div>

            <h1
              className="font-display mb-6 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              Commercial Cleaning
              <br />
              <span className="text-gradient">Professional Training</span>
            </h1>

            <p
              className="mb-8 max-w-xl text-lg leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Industry-leading IICRC certification for commercial cleaning companies. Differentiate
              your business with nationally recognised carpet restoration and commercial carpet care
              credentials.
            </p>

            {/* Discipline pills */}
            <div className="mb-10 flex flex-wrap gap-2">
              <DisciplinePill code="CRT" label="Carpet Restoration" color="#26c4a0" />
              <DisciplinePill code="CCT" label="Commercial Carpet Care" color="#17b8d4" />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <GlassStatCard value="45,000+" label="Cleaning Businesses" />
            <GlassStatCard value="Professional" label="Certification" />
            <GlassStatCard value="IICRC" label="CEC Approved" />
          </div>
        </section>

        {/* Why this matters */}
        <section className="py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p
                className="mb-3 text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Why Cleaning Companies Choose CARSI
              </p>
              <h2
                className="font-display text-3xl font-bold"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                Built for <span className="text-gradient">professional cleaners</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {[
                {
                  Icon: Award,
                  title: 'Win More Contracts',
                  desc: 'IICRC-certified teams win more commercial tenders. Stand out from competitors with recognised credentials.',
                  color: '#17b8d4',
                  glow: 'rgba(23,184,212,0.15)',
                },
                {
                  Icon: Sparkles,
                  title: 'Technical Excellence',
                  desc: 'Master commercial carpet care methods, hot water extraction, encapsulation, and fibre identification.',
                  color: '#26c4a0',
                  glow: 'rgba(38,196,160,0.15)',
                },
                {
                  Icon: Shield,
                  title: 'Verifiable Credentials',
                  desc: 'Earn CECs with downloadable transcripts. Share credentials with clients and facility managers.',
                  color: '#ed9d24',
                  glow: 'rgba(237,157,36,0.15)',
                },
              ].map((item) => (
                <div key={item.title} className="glass-card card-3d rounded-xl p-6">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ background: item.glow, border: `1px solid ${item.color}30` }}
                  >
                    <item.Icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                  <h3
                    className="font-display mb-2 text-sm font-bold"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Course grid */}
        <section className="py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p
                className="mb-2 text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Commercial Cleaning Courses
              </p>
              <h2
                className="font-display text-3xl font-bold"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                CRT &amp; CCT Training
              </h2>
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
              <CourseGrid courses={courses} initialTab="All" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div
              className="relative overflow-hidden rounded-2xl px-8 py-14"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(23,184,212,0.2)',
                boxShadow: '0 0 60px rgba(23,184,212,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(23,184,212,0.12) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                }}
              />
              <p
                className="relative z-10 mb-4 text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Commercial Cleaning Training
              </p>
              <h2
                className="font-display relative z-10 mb-4 text-4xl font-bold"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                Upskill Your <span className="text-gradient">Team</span>
              </h2>
              <p
                className="relative z-10 mx-auto mb-8 max-w-lg text-base"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                $795 AUD/year per seat. 7-day free trial. Bulk team pricing available.
              </p>
              <div className="relative z-10 flex justify-center gap-3">
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-2 rounded-lg px-8 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: 'linear-gradient(135deg, #ed9d24 0%, #d4891e 100%)',
                    boxShadow: '0 0 30px rgba(237,157,36,0.4)',
                  }}
                >
                  Upskill Your Team <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-lg px-8 py-3 font-semibold transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  Browse All Courses
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
