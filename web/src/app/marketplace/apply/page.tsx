import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function MarketplaceApplyPage() {
  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Apply as a service provider"
          description="Listings are invite-quality: we review every application before a profile can go live. Submit the basics here; a structured form and intake pipeline will roll out in the next implementation pass."
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/marketplace#how-it-works"
            className="polish-cta-link inline-flex w-fit rounded-lg bg-zinc-900/85 px-4 py-2 text-sm text-zinc-100"
          >
            Read how hiring works
          </Link>
          <Link
            href="/marketplace"
            className="text-sm text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
          >
            ← Back to marketplace
          </Link>
        </div>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          What we will collect
        </h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-zinc-400">
          <li>Identity and profile basics</li>
          <li>Services offered and specialization tags</li>
          <li>Portfolio links and prior delivery history (optional resume)</li>
          <li>Pricing model: fixed, range, hourly, or custom</li>
          <li>Communication channels and social accounts</li>
          <li>
            Acknowledgement that completed jobs require buyer rating and written
            review
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-500">
          For now, use{" "}
          <Link
            href="/contact"
            className="text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-zinc-100"
          >
            Contact
          </Link>{" "}
          if you want to signal interest early. The on-platform application form
          and reviewer queue are on the near-term roadmap.
        </p>
      </section>
    </div>
  );
}
