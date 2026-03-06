import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Science of Property Restoration Podcast | CARSI',
  description:
    "Listen to The Science of Property Restoration — CARSI's podcast covering water damage, mould remediation, structural drying, and fire restoration for Australian professionals.",
  openGraph: {
    title: 'The Science of Property Restoration Podcast | CARSI',
    description:
      'Industry insights and technical deep-dives for restoration professionals. Available on Spotify, Apple Podcasts, Google Podcasts, and YouTube.',
    type: 'website',
  },
};

const EPISODES = [
  {
    number: 'EP 01',
    title: 'Understanding IICRC S500 Water Damage Categories',
    description:
      'We break down the three categories of water damage under the IICRC S500 standard and explain how category affects extraction, drying, and antimicrobial decisions.',
    duration: '38 min',
  },
  {
    number: 'EP 02',
    title: 'Psychrometrics for Structural Drying: Why Dewpoint Matters',
    description:
      'A technical deep-dive into the science of moisture movement, vapour pressure, and how to read psychrometric charts for faster, more accurate drying decisions.',
    duration: '45 min',
  },
  {
    number: 'EP 03',
    title: 'Mould Remediation Under AS/NZS Standards: Australian Compliance Explained',
    description:
      'Guest episode with an IEP covering the key differences between IICRC S520 and Australian Standards for mould work, and what documentation you need to protect yourself legally.',
    duration: '52 min',
  },
];

export default function PodcastPage() {
  return (
    <main className="min-h-screen" style={{ background: '#050505' }}>
      {/* Mesh background */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16">
        {/* ─── Hero ─────────────────────────────────────────────────────── */}
        <section className="mb-14">
          <p
            className="mb-3 font-mono text-xs tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            CARSI Podcast
          </p>

          <h1
            className="mb-4 text-4xl font-bold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.95)', fontFamily: 'var(--font-display)' }}
          >
            The Science of Property Restoration
          </h1>

          <p
            className="mb-6 max-w-2xl text-sm leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Industry insights and technical deep-dives for restoration professionals.
          </p>

          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-sm border px-3 py-1 font-mono text-xs tracking-widest uppercase"
              style={{
                borderColor: 'rgba(0,245,255,0.25)',
                background: 'rgba(0,245,255,0.06)',
                color: '#00F5FF',
              }}
            >
              3 Episodes Available
            </span>
            <span
              className="rounded-sm border px-3 py-1 font-mono text-xs tracking-widest uppercase"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              All Major Platforms
            </span>
          </div>
        </section>

        {/* ─── Platform links ────────────────────────────────────────────── */}
        <section className="mb-14">
          <p
            className="mb-4 font-mono text-xs tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Listen On
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              {
                label: 'Spotify',
                href: 'https://open.spotify.com/show/4FVBn8Cfyx2jOx0m4MksuG',
              },
              {
                label: 'Apple Podcasts',
                href: 'https://podcasts.apple.com/au/podcast/the-science-of-property-restoration/id1634567890',
              },
              {
                label: 'Google Podcasts',
                href: 'https://podcasts.google.com/search/the%20science%20of%20property%20restoration',
              },
              {
                label: 'YouTube',
                href: 'https://www.youtube.com/channel/UC3HpNvGJXivLGoPo4m7Qleg',
              },
            ].map((platform) => (
              <a
                key={platform.label}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border px-4 py-2 text-sm transition-colors hover:border-white/20 hover:text-white"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {platform.label}
              </a>
            ))}
          </div>
        </section>

        {/* ─── Featured Episodes ─────────────────────────────────────────── */}
        <section className="mb-14">
          <p
            className="mb-6 font-mono text-xs tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Featured Episodes
          </p>

          <div className="flex flex-col gap-4">
            {EPISODES.map((ep) => (
              <div
                key={ep.number}
                className="rounded-sm border p-5"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(39,39,42,0.5)',
                }}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <span
                    className="font-mono text-xs tracking-widest uppercase"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {ep.number}
                  </span>
                  <span
                    className="shrink-0 font-mono text-xs"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {ep.duration}
                  </span>
                </div>

                <h2
                  className="mb-2 text-sm leading-snug font-semibold"
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  {ep.title}
                </h2>

                <p
                  className="mb-4 text-xs leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {ep.description}
                </p>

                <a
                  href="#"
                  className="inline-block rounded-sm border px-4 py-1.5 font-mono text-xs tracking-widest uppercase transition-colors hover:border-white/20 hover:text-white"
                  style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  Listen Now
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Newsletter CTA ────────────────────────────────────────────── */}
        <section
          className="rounded-sm border p-8"
          style={{
            borderColor: 'rgba(0,245,255,0.2)',
            background: 'rgba(0,245,255,0.05)',
          }}
        >
          <p
            className="mb-1 font-mono text-xs tracking-widest uppercase"
            style={{ color: 'rgba(0,245,255,0.6)' }}
          >
            Stay Updated
          </p>
          <h2 className="mb-2 text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Get notified when new episodes drop.
          </h2>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Join the CARSI community and receive episode alerts, restoration resources, and industry
            news direct to your inbox.
          </p>

          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            action="#"
            method="post"
          >
            <input
              type="email"
              required
              placeholder="your@email.com.au"
              aria-label="Email address"
              className="flex-1 rounded-sm border bg-transparent px-4 py-2.5 text-sm transition-colors outline-none placeholder:text-white/20 focus:border-white/20"
              style={{
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.85)',
              }}
            />
            <button
              type="submit"
              className="rounded-sm px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#00F5FF', color: '#050505' }}
            >
              Subscribe
            </button>
          </form>

          <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No spam. Unsubscribe any time.
          </p>
        </section>
      </div>
    </main>
  );
}
