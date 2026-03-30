import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSessionOrNull } from '@/lib/admin/admin-session';

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return <AdminAccessDenied />;
  }
  return <AdminShell>{children}</AdminShell>;
}
