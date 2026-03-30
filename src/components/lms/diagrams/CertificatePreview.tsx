'use client';

import Image from 'next/image';

const DISCIPLINE_COLORS: Record<string, string> = {
  WRT: '#2490ed',
  CRT: '#26c4a0',
  ASD: '#6c63ff',
  OCT: '#9b59b6',
  CCT: '#17b8d4',
  FSRT: '#f05a35',
  AMRT: '#27ae60',
};

interface CertificatePreviewProps {
  studentName?: string;
  courseName?: string;
  discipline?: string;
  completedDate?: string;
}

export function CertificatePreview({
  studentName = 'James Wilson',
  courseName = 'Water Damage Restoration Technician',
  discipline = 'WRT',
  completedDate = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
}: CertificatePreviewProps) {
  const discColor = DISCIPLINE_COLORS[discipline] ?? '#2490ed';

  return (
    <div
      className="relative mx-auto max-w-xl select-none"
      role="img"
      aria-label={`Certificate of Completion for ${studentName} — ${courseName}`}
    >
      {/* Outer decorative border */}
      <div
        className="rounded-sm p-1"
        style={{
          background: `linear-gradient(135deg, ${discColor}35 0%, ${discColor}12 50%, ${discColor}30 100%)`,
        }}
      >
        {/* Inner certificate card — dark surface */}
        <div
          className="relative rounded-sm bg-[#0a0e14] p-8 text-center"
          style={{
            border: `2px solid ${discColor}55`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
          }}
        >
          {/* Corner decorations */}
          <div
            className="absolute top-3 left-3 h-6 w-6 border-t-2 border-l-2"
            style={{ borderColor: discColor }}
          />
          <div
            className="absolute top-3 right-3 h-6 w-6 border-t-2 border-r-2"
            style={{ borderColor: discColor }}
          />
          <div
            className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2"
            style={{ borderColor: discColor }}
          />
          <div
            className="absolute right-3 bottom-3 h-6 w-6 border-r-2 border-b-2"
            style={{ borderColor: discColor }}
          />

          {/* Brand: logo image only (no text mark) */}
          <div className="mx-auto mb-4 flex justify-center">
            <Image
              src="/logo/logo1.png"
              alt=""
              width={220}
              height={64}
              className="h-14 w-auto max-w-[min(100%,220px)] object-contain object-center"
              priority
              aria-hidden
            />
          </div>

          {/* Heading */}
          <h2
            className="mb-1 text-2xl font-light tracking-wide text-white/95"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Certificate of Completion
          </h2>
          <div className="mx-auto mb-6 h-px w-32" style={{ backgroundColor: discColor }} />

          {/* Certification text */}
          <p className="mb-2 text-xs tracking-wide text-white/45 uppercase">This certifies that</p>
          <p
            className="mb-2 text-xl text-[#7ec5ff]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
          >
            {studentName}
          </p>
          <p className="mb-1 text-xs tracking-wide text-white/45 uppercase">
            has successfully completed
          </p>
          <p
            className="mb-5 text-base font-semibold text-white/90"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {courseName}
          </p>

          {/* Discipline badge */}
          <div className="mx-auto mb-5 flex items-center justify-center gap-2">
            <span
              className="inline-flex items-center rounded-sm px-3 py-1 text-xs font-bold tracking-wider text-white uppercase"
              style={{ backgroundColor: discColor }}
            >
              {discipline}
            </span>
            <span className="text-xs text-white/40">Discipline</span>
          </div>

          {/* Date + IICRC stamp */}
          <div className="mx-auto mb-6 flex items-center justify-center gap-6">
            <p className="text-xs text-white/50">{completedDate}</p>
            <div
              className="rounded-sm border px-3 py-1 text-[10px] font-bold tracking-wider uppercase"
              style={{
                borderColor: `${discColor}60`,
                color: discColor,
              }}
            >
              IICRC CEC Approved
            </div>
          </div>

          {/* Signature line — Training Director only */}
          <div className="mx-auto max-w-xs text-center">
            <p
              className="mb-1 text-2xl text-white/85"
              style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive' }}
            >
              Philip McGurk
            </p>
            <div className="mb-1 border-b border-white/20" />
            <p className="text-[10px] tracking-wide text-white/40 uppercase">Training Director</p>
          </div>
        </div>
      </div>
    </div>
  );
}
