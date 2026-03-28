import { PageHeader } from "@/components/PageHeader";
import { MarketplaceDirectory } from "@/components/MarketplaceDirectory";

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
      <MarketplaceDirectory />
    </div>
  );
}
