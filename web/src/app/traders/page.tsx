import { PageHeader } from "@/components/PageHeader";
import { TradeProjectSearch } from "@/components/TradeProjectSearch";

export default function TradersPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="polish-surface-page rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
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
