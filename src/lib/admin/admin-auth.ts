import { jwtVerify, SignJWT } from 'jose';

export const ADMIN_COOKIE_NAME = 'admin_session';

const DEFAULT_ADMIN_EMAIL = 'mmlrana00@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'Rana1199@';

/**
 * Server-side: read from env on each call so `.env` changes apply without stale module cache.
 * Trims whitespace / CRLF that often breaks exact password matches in `.env` files.
 */
export function getAdminEmail(): string {
  const v = process.env.ADMIN_EMAIL;
  if (typeof v === 'string' && v.trim()) return v.trim();
  return DEFAULT_ADMIN_EMAIL;
}

export function getAdminPassword(): string {
  const v = process.env.ADMIN_PASSWORD;
  if (typeof v === 'string' && v.trim()) return v.trim();
  return DEFAULT_ADMIN_PASSWORD;
}

/**
 * Login form prefill (client + server). Non-`NEXT_PUBLIC_` env vars are not available in the
 * browser bundle, so we also support optional `NEXT_PUBLIC_ADMIN_EMAIL` for a matching hint.
 */
export const ADMIN_EMAIL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim()) ||
  (typeof process !== 'undefined' && process.env.ADMIN_EMAIL?.trim()) ||
  DEFAULT_ADMIN_EMAIL;

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET ??
  // Fall back to the app JWT secret so this works out-of-the-box in dev.
  process.env.JWT_SECRET ??
  'dev-admin-jwt-secret-change-me';

function getSecretKeyBytes(): Uint8Array {
  return new TextEncoder().encode(ADMIN_JWT_SECRET);
}

export type AdminSessionClaims = {
  email: string;
};

export async function createAdminSessionToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin')
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(getSecretKeyBytes());
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKeyBytes());
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (sub !== 'admin') return null;
    const email = typeof payload.email === 'string' ? payload.email : '';
    if (!email) return null;
    if (email.toLowerCase() !== getAdminEmail().toLowerCase()) return null;
    return { email };
  } catch {
    return null;
  }
}

