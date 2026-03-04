import { Sparkles, Shield, Award, Users } from 'lucide-react';
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
    const [crtRes, cctRes, octRes] = await Promise.all([
      fetch(`${backendUrl}/api/lms/courses?discipline=CRT&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=CCT&limit=8`, { next: { revalidate: 60 } }),
      fetch(`${backendUrl}/api/lms/courses?discipline=OCT&limit=8`, { next: { revalidate: 60 } }),
    ]);

    const crtData = crtRes.ok ? await crtRes.json() : { items: [] };
    const cctData = cctRes.ok ? await cctRes.json() : { items: [] };
    const octData = octRes.ok ? await octRes.json() : { items: [] };

    const seen = new Set<string>();
    const combined = [];
    for (const c of [
      ...(crtData.items ?? []),
      ...(cctData.items ?? []),
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

const ACCENT_COLOR = '#2490ed';

const disciplines = [
  { code: 'CRT', label: 'Carpet Restoration', color: '#2490ed' },
  { code: 'CCT', label: 'Commercial Carpet', color: '#1976d2' },
  { code: 'OCT', label: 'Odour Control', color: '#1565c0' },
];

const stats = [
  { value: '8,000+', label: 'Cleaning Companies' },
  { value: 'IICRC', label: 'Certification' },
  { value: 'CECs', label: 'Continuous Education' },
];

const whyCards = [
  {
    icon: Award,
    title: 'IICRC Certification',
    description:
      'Earn recognised IICRC certifications that differentiate your cleaning business. Stand out in tender submissions and client proposals.',
    color: '#2490ed',
  },
  {
    icon: Shield,
    title: 'Insurance Recognition',
    description:
      'IICRC credentials are recognised by major insurers. Trained technicians can work on insurance restoration jobs with confidence.',
    color: '#1976d2',
  },
  {
    icon: Users,
    title: 'Team Development',
    description:
      'Build a skilled workforce with verifiable credentials. Track team CEC progress and maintain certification status across your organisation.',
    color: '#ed9d24',
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function CommercialCleaningIndustryPage() {
  const courses = await getIndustryCourses();

  return (
    <IndustryPageLayout>
      <IndustryHero
        icon={Sparkles}
        industryName="Commercial Cleaning"
        accentColor={ACCENT_COLOR}
        headline="Commercial Cleaning"
        headlineAccent="Professional Certification"
        description="IICRC certification training for commercial cleaning contractors. Earn recognised credentials in carpet restoration, commercial carpet care, and odour control."
        disciplines={disciplines}
        stats={stats}
      />

      <IndustryWhySection
        industryName="Cleaning Contractors"
        headline="Built for"
        headlineAccent="professional growth"
        cards={whyCards}
      />

      <IndustryCourseSection
        industryName="Commercial Cleaning"
        disciplineList="CRT, CCT & OCT"
        courses={courses}
      />

      <ContractorAddOns accentColor={ACCENT_COLOR} />

      <IndustryCTA
        subtitle="Cleaning Professional Training"
        title="Pro Cleaning Bundle"
        price="$195"
        description="CRT Carpet Restoration + CCT Commercial Carpet + OCT Odour Control. Perfect for cleaning contractors seeking IICRC credentials."
        ctaText="Get Certified"
        accentColor={ACCENT_COLOR}
      />
    </IndustryPageLayout>
  );
}
