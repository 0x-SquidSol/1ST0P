import { PageHeader } from "@/components/PageHeader";

const statusCards = [
  {
    area: "Platform UI",
    state: "Active",
    detail: "Core shell, lane navigation, and foundational pages are live and iterating.",
  },
  {
    area: "Launch Operations",
    state: "In Progress",
    detail: "Application-first launch process and manual review workflow are being productized.",
  },
  {
    area: "Marketplace Flows",
    state: "In Progress",
    detail: "Provider onboarding, trust signaling, and escrow-first hiring flow are under development.",
  },
];

export default function StatusPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="polish-surface-page rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Status"
          title="Build Status"
          description="A lightweight snapshot of current platform progress. This page will expand with richer release signals in later phases."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {statusCards.map((card) => (
          <article
            key={card.area}
            className="polish-card-interactive rounded-2xl bg-zinc-950/42 p-6"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {card.state}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-100">{card.area}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {card.detail}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}

