import Link from "next/link";
import { ProviderHeaderSocial } from "@/components/ProviderHeaderSocial";
import { ProviderReputationPanel } from "@/components/ProviderReputationPanel";
import { ProviderServiceColumns } from "@/components/ProviderServiceColumns";
import {
  MAX_PUBLIC_SERVICES,
  type ProviderProfile,
  publicOfferings,
} from "@/lib/provider-profile";

export function ProviderProfileView({ profile }: { profile: ProviderProfile }) {
  const since = new Date(profile.memberSince).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const shown = publicOfferings(profile.offerings);
  const extraOfferings = profile.offerings.length - shown.length;

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Provider
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl md:text-4xl">
              {profile.displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              {profile.headline}
            </p>
            <ProviderHeaderSocial socialLinks={profile.socialLinks} />
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
            <span className="polish-pill rounded-lg px-3 py-1.5 text-xs text-zinc-200">
              {profile.approved ? "Approved listing" : "Not listed"}
            </span>
            <span className="polish-pill rounded-lg px-3 py-1.5 text-xs text-zinc-400">
              Member since {since}
            </span>
          </div>
        </div>
      </section>

      <section className="polish-section max-w-full min-w-0 rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          About
        </h2>
        <p className="mt-3 break-words text-sm leading-relaxed text-zinc-300">
          {profile.bio}
        </p>
      </section>

      <section className="polish-section max-w-full min-w-0 rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Services
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Up to {MAX_PUBLIC_SERVICES} services per listing. Each column is scoped
          to that service—tags, rates, and reviews are separate. Proof and extra
          deliverable fields ship with the application flow.
        </p>
        <div className="mt-5">
          <ProviderServiceColumns
            providerSlug={profile.slug}
            offerings={shown}
          />
        </div>
        {extraOfferings > 0 ? (
          <p className="mt-4 text-xs text-zinc-600">
            +{extraOfferings} additional service
            {extraOfferings === 1 ? "" : "s"} on file (not shown publicly until
            intake allows more than {MAX_PUBLIC_SERVICES}).
          </p>
        ) : null}
      </section>

      <ProviderReputationPanel
        providerSlug={profile.slug}
        serviceNames={shown.map((o) => o.serviceName)}
        fallbackRating={profile.listingRating}
        fallbackReviewCount={profile.reviewCount}
      />

      <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs text-zinc-500">
        <Link
          href="/marketplace?tab=search"
          className="text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-zinc-100"
        >
          ← Service search
        </Link>
        <Link
          href="/marketplace"
          className="text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-200"
        >
          Marketplace home
        </Link>
      </p>
    </div>
  );
}
