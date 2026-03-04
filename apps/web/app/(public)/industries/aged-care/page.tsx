import { HeartPulse, Shield, Bug } from 'lucide-react';
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
    const [crtRes, amrtRes] = await Promise.all([
      fetch(`${backendUrl}/api/lms/courses?discipline=CRT&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=AMRT&limit=8`, { next: { revalidate: 60 } }),
    ]);

    const crtData = crtRes.ok ? await crtRes.json() : { items: [] };
    const amrtData = amrtRes.ok ? await amrtRes.json() : { items: [] };

    const seen = new Set<string>();
    const combined = [];
    for (const c of [...(crtData.items ?? []), ...(amrtData.items ?? [])]) {
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

const ACCENT_COLOR = '#27ae60';

const disciplines = [
  { code: 'CRT', label: 'Carpet Restoration', color: '#26c4a0' },
  { code: 'AMRT', label: 'Applied Microbial Remediation', color: '#27ae60' },
];

const stats = [
  { value: '15,000+', label: 'Aged Care Facilities' },
  { value: 'NQF', label: 'Compliance Requirement' },
  { value: 'IICRC', label: 'CEC Approved' },
];

const whyCards = [
  {
    icon: Shield,
    title: 'NQF Compliance',
    description:
      'Meet National Quality Framework infection control requirements with IICRC-aligned training for cleaning and maintenance teams.',
    color: '#27ae60',
  },
  {
    icon: Bug,
    title: 'Microbial Remediation',
    description:
      'Train staff to identify, assess, and remediate mould and microbial contamination in aged care environments.',
    color: '#26c4a0',
  },
  {
    icon: HeartPulse,
    title: 'Resident Wellbeing',
    description:
      'Proper carpet and upholstery hygiene directly impacts resident health. Earn CECs with verifiable transcripts for auditors.',
    color: '#ed9d24',
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function AgedCareIndustryPage() {
  const courses = await getIndustryCourses();

  return (
    <IndustryPageLayout>
      <IndustryHero
        icon={HeartPulse}
        industryName="Aged Care Industry"
        accentColor={ACCENT_COLOR}
        headline="Aged Care Infection"
        headlineAccent="Control Training"
        description="NQF-compliant hygiene and infection control for residential aged care facilities. Equip your cleaning and maintenance staff with IICRC-recognised credentials in carpet restoration and microbial remediation."
        disciplines={disciplines}
        stats={stats}
      />

      <IndustryWhySection
        industryName="Aged Care Providers"
        headline="Built for"
        headlineAccent="resident safety"
        cards={whyCards}
      />

      <IndustryCourseSection
        industryName="Aged Care"
        disciplineList="CRT & AMRT"
        courses={courses}
      />

      <ContractorAddOns accentColor={ACCENT_COLOR} />

      <IndustryCTA
        subtitle="Aged Care Training"
        title="Certify Your Staff"
        price="Today"
        description="$795 AUD/year per seat. 7-day free trial. Bulk team pricing available."
        ctaText="Certify Your Staff Today"
        accentColor={ACCENT_COLOR}
      />
    </IndustryPageLayout>
  );
}
