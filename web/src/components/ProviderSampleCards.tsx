import Link from "next/link";
import { listPublicProviders } from "@/lib/mock-providers";

export function ProviderSampleCards({ compact = false }: { compact?: boolean }) {
  const providers = listPublicProviders();

  if (compact) {
    return (
      <section
        id="sample-providers"
        className="polish-surface-subtle max-w-full min-w-0 scroll-mt-24 rounded-2xl bg-zinc-950/38 p-3 sm:p-4"
      >
        <div className="min-w-0 border-b border-white/[0.06] pb-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Providers
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-zinc-100">
            Sample profiles
          </h2>
          <p className="mt-1 text-[10px] leading-snug text-zinc-600">
            Mock data — real listings after application + approval.
          </p>
        </div>
        <ul className="mt-3 flex min-w-0 flex-col gap-2">
          {providers.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/marketplace/providers/${p.slug}`}
                className="polish-card-interactive flex flex-col rounded-xl border border-white/10 bg-zinc-950/50 p-3 transition"
              >
                <span className="text-sm font-semibold text-zinc-100">
                  {p.displayName}
                </span>
                <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500">
                  {p.headline}
                </span>
                <span className="mt-2 text-[10px] font-medium text-zinc-600">
                  {p.rateSummary}
                </span>
                <span className="mt-1.5 text-[10px] text-zinc-600">
                  View profile →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      id="sample-providers"
      className="polish-surface-subtle max-w-full min-w-0 scroll-mt-24 space-y-4 rounded-3xl bg-zinc-950/38 p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Providers
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-zinc-100 sm:text-xl">
            Sample approved profiles
          </h2>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-zinc-500 sm:text-right">
          Mock data for layout review. Real listings will follow the application
          and manual approval flow.
        </p>
      </div>
      <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
        {providers.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/marketplace/providers/${p.slug}`}
              className="polish-card-interactive flex min-h-[140px] flex-col rounded-2xl bg-zinc-950/45 p-4 sm:p-5"
            >
              <span className="text-base font-semibold text-zinc-100">
                {p.displayName}
              </span>
              <span className="mt-2 line-clamp-2 text-sm text-zinc-400">
                {p.headline}
              </span>
              <span className="mt-auto pt-3 text-xs font-medium text-zinc-500">
                {p.rateSummary}
              </span>
              <span className="mt-2 text-xs text-zinc-600">
                View profile →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
