import { Suspense } from "react";

import { PageHeader } from "@/components/PageHeader";
import { MarketplaceDirectory } from "@/components/MarketplaceDirectory";

function MarketplaceDirectoryFallback() {
  return (
    <section
      className="polish-surface-subtle space-y-4 rounded-3xl bg-zinc-950/38 p-4 sm:p-6"
      aria-hidden
    >
      <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-800/80" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-24 animate-pulse rounded-full bg-zinc-800/80"
          />
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-zinc-900/60"
          />
        ))}
      </div>
    </section>
  );
}

export default function MarketplacePage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="polish-surface-page rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Discover Services and Providers"
          description="Browse approved providers and services with escrow-first expectations, clear milestones, and mandatory closeout feedback to keep quality high."
        />
      </section>
      <Suspense fallback={<MarketplaceDirectoryFallback />}>
        <MarketplaceDirectory />
      </Suspense>
    </div>
  );
}
