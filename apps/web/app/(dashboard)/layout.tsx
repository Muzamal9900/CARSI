import { LMSIconRail } from '@/components/layout/LMSIconRail';
import { LMSContextPanel } from '@/components/layout/LMSContextPanel';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen" style={{ background: '#060a14' }}>
      {/* Animated mesh blobs — provide depth behind glass panels */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      <LMSIconRail />
      <LMSContextPanel />

      <main className="relative z-10 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
