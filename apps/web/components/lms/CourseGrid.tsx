'use client';

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { CourseCard } from './CourseCard';

const DISCIPLINE_TABS = ['All', 'WRT', 'CRT', 'ASD', 'OCT', 'CCT', 'FSRT', 'AMRT', 'Free'] as const;
type DisciplineTab = (typeof DISCIPLINE_TABS)[number];

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

interface CourseGridProps {
  courses: Course[];
  initialTab?: string;
}

type SortKey = 'title' | 'price' | 'updated';

function sortCourses(courses: Course[], sortBy: SortKey): Course[] {
  return [...courses].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'price') {
      const pa = typeof a.price_aud === 'string' ? parseFloat(a.price_aud) : a.price_aud;
      const pb = typeof b.price_aud === 'string' ? parseFloat(b.price_aud) : b.price_aud;
      return pa - pb;
    }
    if (sortBy === 'updated') {
      const da = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const db = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return db - da;
    }
    return 0;
  });
}

function matchesDiscipline(course: Course, tab: DisciplineTab): boolean {
  if (tab === 'All') return true;
  if (tab === 'Free') {
    const p =
      typeof course.price_aud === 'string' ? parseFloat(course.price_aud) : course.price_aud;
    return course.is_free === true || p === 0;
  }
  const disc = course.discipline ?? course.category ?? '';
  return disc.toUpperCase().includes(tab);
}

export function CourseGrid({ courses, initialTab = 'All' }: CourseGridProps) {
  const validInitial: DisciplineTab = (DISCIPLINE_TABS as readonly string[]).includes(initialTab)
    ? (initialTab as DisciplineTab)
    : 'All';

  const [activeTab, setActiveTab] = useState<DisciplineTab>(validInitial);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('updated');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const base = courses.filter(
      (c) =>
        matchesDiscipline(c, activeTab) &&
        (q === '' ||
          c.title.toLowerCase().includes(q) ||
          (c.short_description ?? '').toLowerCase().includes(q))
    );
    return sortCourses(base, sortBy);
  }, [courses, activeTab, searchQuery, sortBy]);

  return (
    <div>
      {/* Discipline tab bar */}
      <div className="scrollbar-hide mb-4 flex gap-0 overflow-x-auto border-b border-[#E5E7EB]">
        {DISCIPLINE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
              activeTab === tab
                ? 'border-[#2490ed] text-[#2490ed]'
                : 'border-transparent text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search + sort row */}
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-52 rounded-sm border border-[#E5E7EB] bg-white py-1.5 pr-3 pl-8 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#2490ed] focus:ring-1 focus:ring-[#2490ed] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>
              {filtered.length} course{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-sm border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-sm text-[#374151] focus:ring-1 focus:ring-[#2490ed] focus:outline-none"
        >
          <option value="updated">Recently Updated</option>
          <option value="price">Price</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm text-[#6B7280]">
            No courses found{searchQuery ? ` for "${searchQuery}"` : ''}.
          </p>
        </div>
      )}
    </div>
  );
}
