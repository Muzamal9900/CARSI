import { cookies } from 'next/headers';

import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, type AdminSessionClaims } from '@/lib/admin/admin-auth';

export async function getAdminSessionOrNull(): Promise<AdminSessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}
