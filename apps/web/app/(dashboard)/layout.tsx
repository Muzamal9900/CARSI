import { LMSIconRail } from '@/components/layout/LMSIconRail';
import { LMSContextPanel } from '@/components/layout/LMSContextPanel';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <LMSIconRail />
      <LMSContextPanel />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
