import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4"
      style={{ background: '#060a14' }}
    >
      {/* Subtle radial glow — matches homepage */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(36,144,237,0.06) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md py-12">
        {/* Logo + Wordmark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-sm text-base font-bold text-white"
              style={{ background: '#2490ed' }}
            >
              C
            </div>
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              CARSI
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs transition-colors duration-150 hover:text-white"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            &larr; Back to home
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
