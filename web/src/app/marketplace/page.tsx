import Link from "next/link";

import { MarketplaceShell } from "@/components/MarketplaceShell";
import { PageHeader } from "@/components/PageHeader";

export default function MarketplacePage() {
  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Discover Services and Providers"
          description="Browse approved providers and services with escrow-first expectations, clear milestones, and mandatory closeout feedback to keep quality high."
        />
        <p className="mt-5 max-w-2xl text-sm text-zinc-400">
          Are you a service provider?{" "}
          <Link
            href="/marketplace/apply"
            className="font-medium text-zinc-100 underline decoration-white/25 underline-offset-4 transition hover:decoration-white/50"
          >
            Apply to be listed
          </Link>
          .
        </p>
      </section>

      <MarketplaceShell />
    </div>
  );
}
