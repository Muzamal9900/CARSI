import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';

export default function RegisterPage() {
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
          Create an account
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Enter your details to create your account
        </p>
        <p className="text-xs font-medium tracking-wide" style={{ color: '#2490ed' }}>
          IICRC CEC-approved restoration training
        </p>
      </div>

      <RegisterForm />

      <div className="mt-5 text-center text-sm">
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Already have an account? </span>
        <Link
          href="/login"
          className="font-medium underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:text-white hover:decoration-white/50"
          style={{ color: '#00F5FF' }}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
