'use client';

import Link from 'next/link';

import { useAuth } from '@/components/auth/auth-provider';

type Variant = 'desktop' | 'mobile';

export function AuthNavLinks({
  variant,
  onNavigate,
}: {
  variant: Variant;
  /** Close mobile menu after navigation */
  onNavigate?: () => void;
}) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    if (variant === 'desktop') {
      return <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.25)' }} aria-hidden>…</span>;
    }
    return null;
  }

  if (user) {
    const label = user.full_name?.trim() || user.email;
    if (variant === 'desktop') {
      return (
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="max-w-[200px] truncate text-sm transition-colors duration-150 hover:text-white"
            style={{ color: 'rgba(255, 255, 255, 0.75)' }}
            title={label}
          >
            {label}
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm transition-colors duration-150 hover:text-white"
            style={{ color: 'rgba(255, 255, 255, 0.45)' }}
          >
            Sign out
          </button>
        </div>
      );
    }

    return (
      <div
        className="mt-4 space-y-2 border-t pt-4"
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <div
          className="rounded-md px-4 py-2 text-center text-sm"
          style={{ color: 'rgba(255, 255, 255, 0.85)' }}
        >
          {label}
        </div>
        <Link
          href="/dashboard"
          onClick={() => onNavigate?.()}
          className="block rounded-md px-4 py-3 text-center text-base font-medium transition-colors duration-150"
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            background: 'rgba(36, 144, 237, 0.15)',
            border: '1px solid rgba(36, 144, 237, 0.25)',
          }}
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => {
            void signOut();
            onNavigate?.();
          }}
          className="w-full rounded-md px-4 py-3 text-center text-base font-medium transition-colors duration-150"
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  if (variant === 'desktop') {
    return (
      <>
        <Link
          href="/login"
          onClick={() => onNavigate?.()}
          className="text-sm transition-colors duration-150 hover:text-white"
          style={{ color: 'rgba(255, 255, 255, 0.5)' }}
        >
          Sign In
        </Link>
        <Link
          href="/courses"
          onClick={() => onNavigate?.()}
          className="rounded-sm px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
          style={{ background: '#ed9d24' }}
        >
          Browse Courses
        </Link>
      </>
    );
  }

  return (
    <div
      className="mt-4 space-y-2 border-t pt-4"
      style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
    >
      <Link
        href="/login"
        onClick={() => onNavigate?.()}
        className="block rounded-md px-4 py-3 text-center text-base font-medium transition-colors duration-150"
        style={{
          color: 'rgba(255, 255, 255, 0.7)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        Sign In
      </Link>
      <Link
        href="/courses"
        onClick={() => onNavigate?.()}
        className="block rounded-md px-4 py-3 text-center text-base font-medium text-white transition-opacity duration-150 hover:opacity-90"
        style={{ background: '#ed9d24' }}
      >
        Browse Courses
      </Link>
    </div>
  );
}
