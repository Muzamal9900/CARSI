import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, Award, Users } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Course {
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
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getFeaturedCourses(): Promise<Course[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${backendUrl}/api/lms/courses?limit=3`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const disciplines = [
  { code: 'WRT', label: 'Water Restoration' },
  { code: 'CRT', label: 'Carpet Restoration' },
  { code: 'ASD', label: 'Applied Structural Drying' },
  { code: 'OCT', label: 'Odour Control' },
  { code: 'CCT', label: 'Commercial Carpet' },
  { code: 'FSRT', label: 'Fire & Smoke' },
  { code: 'AMRT', label: 'Applied Microbial' },
];

const whyCarsi = [
  {
    icon: CheckCircle2,
    title: 'IICRC Aligned',
    desc: 'All courses designed around IICRC technical standards. Earn CECs that count toward your annual maintenance requirements.',
    color: 'text-[#2490ed]',
  },
  {
    icon: Award,
    title: 'CEC Tracking',
    desc: 'Automatic per-discipline CEC ledger. Download your transcript at any time — ready for IICRC submission.',
    color: 'text-[#ed9d24]',
  },
  {
    icon: Users,
    title: 'Industry Recognised',
    desc: 'Trusted by restoration contractors and insurance assessors across Australia. Our courses reference AS/NZS standards.',
    color: 'text-[#2490ed]',
  },
];

function FeaturedCourseCard({ course }: { course: Course }) {
  const priceNum =
    typeof course.price_aud === 'string' ? parseFloat(course.price_aud) : course.price_aud;
  const isFree = course.is_free || priceNum === 0;
  const discipline = course.discipline ?? null;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-[#E5E7EB] bg-white transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800">
        {course.thumbnail_url && (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        {discipline && (
          <span className="absolute top-2 left-2 rounded-sm bg-white/90 px-2 py-0.5 text-xs font-semibold text-[#2490ed]">
            {discipline}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-[#111827]">{course.title}</h3>
        {course.short_description && (
          <p className="mb-3 line-clamp-2 text-xs text-[#6B7280]">{course.short_description}</p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">
            {course.lesson_count != null ? `${course.lesson_count} lessons` : ''}
          </span>
          <span
            className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${
              isFree ? 'bg-[#F0FDF4] text-[#16a34a]' : 'bg-[#FFF7ED] text-[#ed9d24]'
            }`}
          >
            {isFree ? 'Free' : `$${priceNum.toFixed(0)} AUD`}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function Home() {
  const featuredCourses = await getFeaturedCourses();

  return (
    <div className="min-h-screen bg-white">
      {/* ── NavBar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#2490ed]">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="text-sm font-bold text-[#111827]">CARSI</span>
            </Link>

            {/* Nav links */}
            <div className="hidden items-center gap-6 text-sm text-[#374151] md:flex">
              <Link href="/courses" className="transition-colors hover:text-[#2490ed]">
                Courses
              </Link>
              <Link href="/pathways" className="transition-colors hover:text-[#2490ed]">
                Pathways
              </Link>
              <Link
                href="/courses?discipline=WRT"
                className="transition-colors hover:text-[#2490ed]"
              >
                Pricing
              </Link>
              <Link href="/about" className="transition-colors hover:text-[#2490ed]">
                About
              </Link>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden px-3 py-1.5 text-sm text-[#374151] transition-colors hover:text-[#2490ed] sm:inline"
              >
                Sign In
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#ed9d24] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d4891e]"
              >
                Enrol Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          {/* Hero text */}
          <div>
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-sm bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#2490ed]">
              🏷 IICRC CEC Approved
            </div>
            <h1 className="mb-4 text-4xl leading-tight font-bold text-[#111827] sm:text-5xl">
              Australia&apos;s Leading
              <br />
              Restoration Training <em className="text-[#2490ed] not-italic">Platform</em>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-[#6B7280]">
              IICRC-aligned CEC training for cleaning and restoration professionals. Earn recognised
              credits, track your progress, and grow your career.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-sm bg-[#ed9d24] px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[#d4891e]"
              >
                Browse Courses <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pathways"
                className="inline-flex items-center gap-2 rounded-sm border border-[#E5E7EB] px-5 py-2.5 font-semibold text-[#374151] transition-colors hover:border-[#2490ed] hover:text-[#2490ed]"
              >
                View Pathways
              </Link>
            </div>
          </div>

          {/* Photo mosaic */}
          <div className="grid h-80 grid-cols-3 grid-rows-3 gap-3 lg:h-96">
            {/* Stat: professionals */}
            <div className="col-span-1 row-span-1 flex flex-col items-center justify-center rounded-sm bg-[#2490ed] p-3 text-white">
              <span className="text-3xl leading-none font-bold">261+</span>
              <span className="mt-1 text-center text-xs text-blue-100">Professionals Trained</span>
            </div>

            {/* Center tall image */}
            <div className="relative col-span-1 row-span-3 overflow-hidden rounded-sm bg-gradient-to-br from-blue-700 to-blue-900">
              <Image
                src="https://carsi.com.au/wp-content/uploads/2024/01/water-damage-restoration-course.jpg"
                alt="Water damage restoration technician at work"
                fill
                className="object-cover"
                sizes="200px"
                onError={() => {}}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent" />
              <div className="absolute right-3 bottom-3 left-3">
                <span className="block text-xs font-semibold text-white">
                  Professional Training
                </span>
                <span className="text-[10px] text-blue-200">Hands-on & Online</span>
              </div>
            </div>

            {/* Stat: courses */}
            <div className="col-span-1 row-span-1 flex flex-col items-center justify-center rounded-sm bg-[#111827] p-3 text-white">
              <span className="text-3xl leading-none font-bold">91</span>
              <span className="mt-1 text-center text-xs text-gray-400">Courses Available</span>
            </div>

            {/* Second image */}
            <div className="relative col-span-1 row-span-1 overflow-hidden rounded-sm bg-gradient-to-br from-teal-600 to-teal-800">
              <Image
                src="https://carsi.com.au/wp-content/uploads/2024/01/iicrc-certified-training.jpg"
                alt="IICRC-aligned classroom training"
                fill
                className="object-cover"
                sizes="150px"
                onError={() => {}}
              />
            </div>

            {/* CEC badge */}
            <div className="col-span-1 row-span-1 flex flex-col justify-center rounded-sm bg-[#EFF6FF] p-3">
              <span className="mb-1 text-lg">🏷</span>
              <span className="text-xs leading-tight font-semibold text-[#2490ed]">
                IICRC CEC Approved
              </span>
              <span className="mt-0.5 text-[10px] text-[#6B7280]">Earn CECs as you learn</span>
            </div>

            {/* Star rating */}
            <div className="col-span-1 row-span-1 flex flex-col items-center justify-center rounded-sm bg-[#FFF7ED] p-3">
              <span className="text-lg font-bold text-[#ed9d24]">4.9★</span>
              <span className="mt-0.5 text-center text-[10px] text-[#9CA3AF]">Industry Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why CARSI ──────────────────────────────────────────────────────── */}
      <section className="border-y border-[#E5E7EB] bg-[#F9FAFB] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-2xl font-bold text-[#111827]">Why CARSI?</h2>
          <p className="mb-10 text-sm text-[#6B7280]">
            Built specifically for the Australian restoration industry.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {whyCarsi.map((item) => (
              <div key={item.title} className="rounded-sm border border-[#E5E7EB] bg-white p-5">
                <item.icon className={`mb-3 h-6 w-6 ${item.color}`} />
                <h3 className="mb-1.5 text-sm font-semibold text-[#111827]">{item.title}</h3>
                <p className="text-xs leading-relaxed text-[#6B7280]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ───────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">Featured Courses</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                IICRC-approved continuing education for restoration professionals.
              </p>
            </div>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm font-medium text-[#2490ed] hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course) => (
                <FeaturedCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Skeleton placeholders when backend unavailable */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-600 to-blue-800" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-[#F3F4F6]" />
                    <div className="h-3 w-1/2 rounded bg-[#F3F4F6]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── IICRC Discipline Pills ─────────────────────────────────────────── */}
      <section className="border-t border-[#E5E7EB] bg-[#F9FAFB] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-lg font-bold text-[#111827]">Browse by IICRC Discipline</h2>
          <p className="mb-6 text-sm text-[#6B7280]">
            Find the courses that match your certification track.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {disciplines.map((d) => (
              <Link
                key={d.code}
                href={`/courses?discipline=${d.code}`}
                className="inline-flex items-center gap-2 rounded-sm border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:border-[#2490ed] hover:text-[#2490ed]"
              >
                <span className="font-mono text-xs font-bold text-[#2490ed]">{d.code}</span>
                <span>{d.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E7EB] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#2490ed]">
                  <span className="text-xs font-bold text-white">C</span>
                </div>
                <span className="text-sm font-bold text-[#111827]">CARSI</span>
              </div>
              <p className="max-w-[160px] text-xs leading-relaxed text-[#6B7280]">
                Australia&apos;s dedicated restoration training platform.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wider text-[#374151] uppercase">
                Courses
              </p>
              <ul className="space-y-1.5">
                {disciplines.slice(0, 4).map((d) => (
                  <li key={d.code}>
                    <Link
                      href={`/courses?discipline=${d.code}`}
                      className="text-xs text-[#6B7280] hover:text-[#2490ed]"
                    >
                      {d.code} — {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wider text-[#374151] uppercase">
                Platform
              </p>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/pathways" className="text-xs text-[#6B7280] hover:text-[#2490ed]">
                    Pathways
                  </Link>
                </li>
                <li>
                  <Link href="/subscribe" className="text-xs text-[#6B7280] hover:text-[#2490ed]">
                    Subscription
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-xs text-[#6B7280] hover:text-[#2490ed]">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/student/credentials"
                    className="text-xs text-[#6B7280] hover:text-[#2490ed]"
                  >
                    Credentials
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wider text-[#374151] uppercase">
                Contact
              </p>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="mailto:info@carsi.com.au"
                    className="text-xs text-[#6B7280] hover:text-[#2490ed]"
                  >
                    info@carsi.com.au
                  </a>
                </li>
                <li>
                  <span className="text-xs text-[#6B7280]">Australia Wide</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-[#F3F4F6] pt-6 sm:flex-row">
            <p className="text-xs text-[#9CA3AF]">© 2026 CARSI Pty Ltd. All rights reserved.</p>
            <p className="text-xs text-[#9CA3AF]">
              IICRC-aligned continuing education — not an RTO
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
