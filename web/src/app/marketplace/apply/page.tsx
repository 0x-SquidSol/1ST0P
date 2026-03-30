import Link from "next/link";
import { ProviderApplicationWizard } from "@/components/ProviderApplicationWizard";

export default function MarketplaceApplyPage() {
  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <ProviderApplicationWizard />
      <p className="flex flex-wrap gap-x-4 gap-y-2 text-center text-xs text-zinc-500 sm:text-left">
        <Link
          href="/marketplace/messages"
          className="text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-zinc-100"
        >
          Messages (applicants)
        </Link>
        <Link
          href="/marketplace?tab=how"
          className="text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200"
        >
          How hiring works
        </Link>
        <Link
          href="/marketplace"
          className="text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
        >
          ← Marketplace home
        </Link>
      </p>
    </div>
  );
}
