import { cookies } from 'next/headers';

import {
  ADMIN_COOKIE_NAME,
  isLmsClaimsAllowedAdminPanel,
  verifyAdminSessionToken,
  type AdminSessionClaims,
} from '@/lib/admin/admin-auth';
import { verifySessionToken } from '@/lib/auth/session-jwt';

/**
 * Admin cookie (`/api/admin/login`) or a valid LMS JWT (`/api/auth/login`) when the user is
 * allowlisted (see `ADMIN_PANEL_EMAILS`, `ADMIN_EMAIL`) or has LMS role `admin`.
 */
export async function getAdminSessionOrNull(): Promise<AdminSessionClaims | null> {
  const cookieStore = await cookies();

  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (adminToken) {
    const fromCookie = await verifyAdminSessionToken(adminToken);
    if (fromCookie) return fromCookie;
  }

  const lmsToken =
    cookieStore.get('auth_token')?.value ?? cookieStore.get('carsi_token')?.value;
  if (lmsToken) {
    const claims = await verifySessionToken(lmsToken);
    if (claims && isLmsClaimsAllowedAdminPanel(claims)) {
      return { email: claims.email };
    }
  }

  return null;
}
