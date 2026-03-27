import { PageHeader } from "@/components/PageHeader";

const pillars = [
  {
    title: "Discovery",
    body: "A single place where builders, providers, and supporters can find real projects and real operators.",
  },
  {
    title: "Credibility",
    body: "Identity-first launch and provider onboarding with manual review checkpoints and transparent context.",
  },
  {
    title: "Execution",
    body: "Escrow-aware collaboration and launch coordination built around deliverables, milestones, and accountability.",
  },
];

export default function VisionPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/50 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Vision"
          title="Why 1ST0P Exists"
          description="1ST0P is building a cleaner on-chain operating layer for serious teams, service providers, and supporters who value accountable execution."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-2xl border border-white/10 bg-zinc-950/40 p-6"
          >
            <h2 className="text-lg font-semibold text-zinc-100">{pillar.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {pillar.body}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}

