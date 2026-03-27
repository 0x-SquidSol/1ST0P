import { PageHeader } from "@/components/PageHeader";
import { MarketplaceDirectory } from "@/components/MarketplaceDirectory";

export default function MarketplacePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/50 p-8">
        <PageHeader
          label="Marketplace"
          title="Discover Services and Providers"
          description="Browse approved providers and services with escrow-first expectations, clear milestones, and mandatory closeout feedback to keep quality high."
        />
      </section>
      <MarketplaceDirectory />
    </div>
  );
}
