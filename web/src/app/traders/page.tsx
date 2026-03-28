import { PageHeader } from "@/components/PageHeader";
import { TradeProjectSearch } from "@/components/TradeProjectSearch";

export default function TradersPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="polish-surface-page rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Trade Console"
          title="Browse projects"
          description="Search and filter every memecoin launched through this program on the active RPC. Open a row for live price, buy/sell, and curve stats. Watchlists and alerts are scheduled for later phases."
        />
      </section>
      <TradeProjectSearch />
    </div>
  );
}
