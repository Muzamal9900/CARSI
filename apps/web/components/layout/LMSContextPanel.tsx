'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';

const disciplines = [
  { code: 'WRT', label: 'Water Restoration' },
  { code: 'CRT', label: 'Carpet Restoration' },
  { code: 'ASD', label: 'Applied Structural Drying' },
  { code: 'OCT', label: 'Odour Control' },
  { code: 'CCT', label: 'Commercial Carpet' },
  { code: 'FSRT', label: 'Fire & Smoke' },
  { code: 'AMRT', label: 'Applied Microbial' },
];

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`block rounded-sm px-3 py-1.5 text-sm transition-colors duration-150 ${
        isActive
          ? 'bg-[#EFF6FF] font-medium text-[#2490ed]'
          : 'text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]'
      }`}
    >
      {children}
    </Link>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold tracking-wider text-[#6B7280] uppercase transition-colors duration-150 hover:text-[#374151]"
      >
        <span>{title}</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && <div className="mt-0.5">{children}</div>}
    </div>
  );
}

export function LMSContextPanel() {
  return (
    <aside className="flex min-h-screen w-[220px] flex-shrink-0 flex-col overflow-y-auto border-r border-[#E5E7EB] bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] px-4 py-4">
        <p className="text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
          CARSI Learning
        </p>
      </div>

      {/* Main nav */}
      <div className="border-b border-[#E5E7EB] px-2 py-3">
        <NavLink href="/student">My Learning</NavLink>
        <NavLink href="/student/credentials">Certificates</NavLink>
        <NavLink href="/courses">All Courses</NavLink>
        <NavLink href="/pathways">Pathways</NavLink>
      </div>

      {/* IICRC Disciplines */}
      <div className="border-b border-[#E5E7EB] px-2 py-3">
        <CollapsibleSection title="IICRC Disciplines">
          {disciplines.map((d) => (
            <Link
              key={d.code}
              href={`/courses?discipline=${d.code}`}
              className="group flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-[#374151] transition-colors duration-150 hover:bg-[#F9FAFB] hover:text-[#111827]"
            >
              <span className="w-9 flex-shrink-0 font-mono text-xs font-semibold text-[#2490ed]">
                {d.code}
              </span>
              <span className="text-xs leading-tight text-[#6B7280] group-hover:text-[#374151]">
                {d.label}
              </span>
            </Link>
          ))}
        </CollapsibleSection>
      </div>

      {/* My Progress */}
      <div className="px-2 py-3">
        <CollapsibleSection title="My Progress" defaultOpen={false}>
          <NavLink href="/student?filter=in_progress">In Progress</NavLink>
          <NavLink href="/student?filter=completed">Completed</NavLink>
        </CollapsibleSection>
      </div>
    </aside>
  );
}
