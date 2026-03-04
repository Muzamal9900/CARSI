export default function AboutPage() {
  return (
    <main className="flex min-h-[60vh] items-start justify-center px-4 py-16">
      <article className="max-w-3xl space-y-8 p-6">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-white">
          About the Unite-Group Nexus
        </h1>

        <section className="space-y-3">
          <h2 className="font-mono text-lg font-semibold tracking-wide text-white/80">CARSI</h2>
          <p className="text-sm leading-relaxed text-white/60">
            CARSI is the learning management engine powering IICRC-aligned continuing education for
            cleaning and restoration professionals across Australia and New Zealand. This is the
            platform you are on right now.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-lg font-semibold tracking-wide text-white/80">
            RestoreAssist
          </h2>
          <p className="text-sm leading-relaxed text-white/60">
            RestoreAssist is the customer-facing restoration brand. It connects property owners and
            insurers with qualified restoration professionals who have completed their training
            through CARSI.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-lg font-semibold tracking-wide text-white/80">
            Unite-Group Nexus
          </h2>
          <p className="text-sm leading-relaxed text-white/60">
            The Unite-Group Nexus is the technology ecosystem that connects CARSI, RestoreAssist,
            and Unite-Hub. It provides shared authentication, credential verification, and data
            exchange across all platforms in the group.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-lg font-semibold tracking-wide text-white/80">
            IICRC Discipline Coverage
          </h2>
          <p className="text-sm leading-relaxed text-white/60">
            CARSI delivers courses aligned to the following IICRC disciplines:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-2 font-mono text-sm text-white/50">
            <li>WRT — Water Restoration Technician</li>
            <li>CRT — Carpet Repair and Reinstallation Technician</li>
            <li>OCT — Odour Control Technician</li>
            <li>ASD — Applied Structural Drying</li>
            <li>CCT — Commercial Carpet Cleaning Technician</li>
            <li>FSRT — Fire and Smoke Restoration Technician</li>
            <li>AMRT — Applied Microbial Remediation Technician</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
