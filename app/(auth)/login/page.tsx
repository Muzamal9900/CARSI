import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div
      className="rounded-sm p-6 sm:p-8"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Sign in
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Enter your email and password to access your account
        </p>
        <p className="text-xs font-medium tracking-wide" style={{ color: '#2490ed' }}>
          IICRC CEC-approved restoration training
        </p>
      </div>

      <LoginForm />

      <div className="mt-5 text-center text-sm">
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Don&apos;t have an account? </span>
        <Link
          href="/register"
          className="font-medium underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:text-white hover:decoration-white/50"
          style={{ color: '#00F5FF' }}
        >
          Sign up
        </Link>
      </div>
      <div className="mt-2 text-center text-sm">
        <Link
          href="/forgot-password"
          className="underline decoration-white/10 underline-offset-4 transition-colors duration-150 hover:text-white hover:decoration-white/30"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}
