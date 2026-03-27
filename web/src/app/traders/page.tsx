import { PageHeader } from "@/components/PageHeader";
import { TradeProjectSearch } from "@/components/TradeProjectSearch";

export default function TradersPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/50 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Trade Console"
          title="Market Activity"
          description="Track launches, scan movement, and review market context in one clean workspace. Watchlists and alerts are scheduled for later phases."
        />
      </section>
      <TradeProjectSearch />
    </div>
  );
}
