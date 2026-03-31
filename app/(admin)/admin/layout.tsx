import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSessionOrNull } from '@/lib/admin/admin-session';

/** Avoid DB access during `next build` (Prisma TLS to managed Postgres can fail in the build environment). */
export const dynamic = 'force-dynamic';

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return <AdminAccessDenied />;
  }
  return <AdminShell>{children}</AdminShell>;
}
