import { Building2, Shield, Flame } from 'lucide-react';
import {
  IndustryPageLayout,
  IndustryHero,
  IndustryWhySection,
  IndustryCourseSection,
  IndustryCTA,
} from '@/components/industries';

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

async function getIndustryCourses() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
  try {
    const [amrtRes, wrtRes, asdRes, fsrtRes] = await Promise.all([
      fetch(`${backendUrl}/api/lms/courses?discipline=AMRT&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=WRT&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=ASD&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=FSRT&limit=8`, { next: { revalidate: 60 } }),
    ]);

    const amrtData = amrtRes.ok ? await amrtRes.json() : { items: [] };
    const wrtData = wrtRes.ok ? await wrtRes.json() : { items: [] };
    const asdData = asdRes.ok ? await asdRes.json() : { items: [] };
    const fsrtData = fsrtRes.ok ? await fsrtRes.json() : { items: [] };

    const seen = new Set<string>();
    const combined = [];
    for (const c of [
      ...(amrtData.items ?? []),
      ...(wrtData.items ?? []),
      ...(asdData.items ?? []),
      ...(fsrtData.items ?? []),
    ]) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        combined.push(c);
      }
    }
    return combined;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page Configuration
// ---------------------------------------------------------------------------

const ACCENT_COLOR = '#2196f3';

const disciplines = [
  { code: 'AMRT', label: 'Applied Microbial Remediation', color: '#2196f3' },
  { code: 'WRT', label: 'Water Damage Restoration', color: '#1976d2' },
  { code: 'ASD', label: 'Applied Structural Drying', color: '#1565c0' },
  { code: 'FSRT', label: 'Fire & Smoke Restoration', color: '#0d47a1' },
];

const stats = [
  { value: '537', label: 'Local Councils' },
  { value: 'WHS', label: 'Act Compliance' },
  { value: 'IICRC', label: 'CEC Approved' },
];

const whyCards = [
  {
    icon: Shield,
    title: 'WHS Due Diligence',
    description:
      'Government employers have strict WHS duties. IICRC training demonstrates due diligence for mould and water hazard identification.',
    color: '#2196f3',
  },
  {
    icon: Building2,
    title: 'AusTender Compliance',
    description:
      'IICRC certification as a pre-qualification criterion for government procurement panels. Verifiable credentials satisfy Commonwealth audit requirements.',
    color: '#1976d2',
  },
  {
    icon: Flame,
    title: 'Heritage Buildings',
    description:
      'Applied structural drying for heritage-listed government buildings. Fire and smoke response training for emergency teams.',
    color: '#ed9d24',
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function GovernmentDefenceIndustryPage() {
  const courses = await getIndustryCourses();

  return (
    <IndustryPageLayout>
      <IndustryHero
        icon={Building2}
        industryName="Government & Defence"
        accentColor={ACCENT_COLOR}
        headline="Government Facility"
        headlineAccent="Restoration Training"
        description="WHS-compliant training for councils, state agencies, and defence facilities. IICRC credentials satisfy AusTender pre-qualification and Commonwealth audit requirements."
        disciplines={disciplines}
        stats={stats}
      />

      <IndustryWhySection
        industryName="Government Agencies"
        headline="Built for"
        headlineAccent="public accountability"
        cards={whyCards}
      />

      <IndustryCourseSection
        industryName="Government"
        disciplineList="AMRT, WRT, ASD & FSRT"
        courses={courses}
      />

      <IndustryCTA
        subtitle="Government Facility Training"
        title="Facility Restoration Bundle"
        price="$295"
        description="WRT + AMRT + ASD training for government facility teams. Bulk 10+ seat licensing available for councils and departments."
        ctaText="Request Bulk Pricing"
        accentColor={ACCENT_COLOR}
      />
    </IndustryPageLayout>
  );
}
