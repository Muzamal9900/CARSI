'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Award,
  GraduationCap,
  Shield,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface NavItem {
  icon: typeof LayoutDashboard;
  href: string;
  label: string;
  adminOnly?: boolean;
  instructorOnly?: boolean;
}

const topNav: NavItem[] = [
  { icon: LayoutDashboard, href: '/dashboard', label: 'Dashboard' },
  { icon: Search, href: '/courses', label: 'Browse Courses' },
  { icon: BookOpen, href: '/student', label: 'My Learning' },
  { icon: Award, href: '/student/credentials', label: 'Credentials' },
  { icon: GraduationCap, href: '/instructor', label: 'Instructor', instructorOnly: true },
  { icon: Shield, href: '/admin', label: 'Admin', adminOnly: true },
];

export function LMSIconRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isAdmin = user?.is_admin ?? false;
  // Treat admin as instructor too for nav purposes
  const isInstructor = isAdmin;

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : (user?.email?.charAt(0).toUpperCase() ?? 'U');

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <aside className="flex min-h-screen w-12 flex-shrink-0 flex-col items-center gap-1 border-r border-[#E5E7EB] bg-[#F9FAFB] py-3">
      {/* CARSI logo mark */}
      <Link
        href="/"
        className="mb-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm bg-[#2490ed]"
        title="CARSI Home"
      >
        <span className="text-sm leading-none font-bold text-white">C</span>
      </Link>

      {/* Top nav items */}
      <nav className="flex w-full flex-col items-center gap-1 px-1">
        {topNav.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          if (item.instructorOnly && !isInstructor) return null;

          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex h-9 w-9 items-center justify-center rounded-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#2490ed]'
                  : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]'
              }`}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom nav */}
      <div className="flex w-full flex-col items-center gap-1 px-1">
        <Link
          href="/dashboard/settings"
          title="Settings"
          className={`flex h-9 w-9 items-center justify-center rounded-sm transition-colors duration-150 ${
            pathname.startsWith('/dashboard/settings')
              ? 'bg-[#EFF6FF] text-[#2490ed]'
              : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]'
          }`}
        >
          <Settings className="h-4 w-4" />
        </Link>

        {/* User avatar */}
        <button
          onClick={handleSignOut}
          title={`${user?.email ?? 'Account'} — click to sign out`}
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-sm bg-[#2490ed] text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#1a7fd4]"
        >
          {initials}
        </button>
      </div>
    </aside>
  );
}
