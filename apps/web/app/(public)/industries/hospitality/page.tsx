import { Hotel, Droplets, Footprints, Waves } from 'lucide-react';
import {
  IndustryPageLayout,
  IndustryHero,
  IndustryWhySection,
  IndustryCourseSection,
  IndustryCTA,
  ContractorAddOns,
} from '@/components/industries';

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

async function getIndustryCourses() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
  try {
    const [wrtRes, crtRes, asdRes, octRes] = await Promise.all([
      fetch(`${backendUrl}/api/lms/courses?discipline=WRT&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=CRT&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=ASD&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=OCT&limit=8`, { next: { revalidate: 60 } }),
    ]);

    const wrtData = wrtRes.ok ? await wrtRes.json() : { items: [] };
    const crtData = crtRes.ok ? await crtRes.json() : { items: [] };
    const asdData = asdRes.ok ? await asdRes.json() : { items: [] };
    const octData = octRes.ok ? await octRes.json() : { items: [] };

    const seen = new Set<string>();
    const combined = [];
    for (const c of [
      ...(wrtData.items ?? []),
      ...(crtData.items ?? []),
      ...(asdData.items ?? []),
      ...(octData.items ?? []),
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

const ACCENT_COLOR = '#ed9d24';

const disciplines = [
  { code: 'WRT', label: 'Water Damage Restoration', color: '#ed9d24' },
  { code: 'CRT', label: 'Carpet Repair & Reinstallation', color: '#d48b1e' },
  { code: 'ASD', label: 'Applied Structural Drying', color: '#bb7918' },
  { code: 'OCT', label: 'Odour Control', color: '#a36712' },
];

const stats = [
  { value: '10,000+', label: 'Hotels' },
  { value: '24/7', label: 'Response' },
  { value: 'IICRC', label: 'Certified' },
];

const whyCards = [
  {
    icon: Droplets,
    title: 'Guest Experience',
    description:
      'Rapid water damage response minimises room downtime and protects guest satisfaction. IICRC-trained teams restore affected areas before reviews are impacted.',
    color: '#ed9d24',
  },
  {
    icon: Footprints,
    title: 'High-Traffic Areas',
    description:
      'Professional carpet maintenance for lobbies, corridors, and conference rooms. CRT-certified technicians extend carpet lifespan in areas with thousands of daily footfalls.',
    color: '#d48b1e',
  },
  {
    icon: Waves,
    title: 'Pool & Spa Areas',
    description:
      'ASD training for pool overflow and spa water incidents. OCT certification for odour control in enclosed wet areas, change rooms, and guest bathrooms.',
    color: '#bb7918',
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function HospitalityIndustryPage() {
  const courses = await getIndustryCourses();

  return (
    <IndustryPageLayout>
      <IndustryHero
        icon={Hotel}
        industryName="Hospitality & Tourism"
        accentColor={ACCENT_COLOR}
        headline="Hospitality"
        headlineAccent="Restoration Training"
        description="Keep guests comfortable and properties protected. IICRC-certified training for hotel maintenance teams covering water damage, carpet care, structural drying, and odour control."
        disciplines={disciplines}
        stats={stats}
      />

      <IndustryWhySection
        industryName="Hospitality Teams"
        headline="Built for"
        headlineAccent="guest-first operations"
        cards={whyCards}
      />

      <IndustryCourseSection
        industryName="Hospitality"
        disciplineList="WRT, CRT, ASD & OCT"
        courses={courses}
      />

      <ContractorAddOns accentColor={ACCENT_COLOR} />

      <IndustryCTA
        subtitle="Hospitality Training Bundle"
        title="Hotel Maintenance Bundle"
        price="$295"
        description="WRT + CRT + OCT training for hotel maintenance teams. Bulk licensing available for hotel chains and resort groups."
        ctaText="Request Bundle Pricing"
        accentColor={ACCENT_COLOR}
      />
    </IndustryPageLayout>
  );
}
