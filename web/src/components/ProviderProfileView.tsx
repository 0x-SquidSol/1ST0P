import Link from "next/link";
import type { ProviderProfile } from "@/lib/provider-profile";
import { PageHeader } from "@/components/PageHeader";

function rateModelLabel(model: ProviderProfile["rateModel"]): string {
  switch (model) {
    case "hourly":
      return "Hourly";
    case "fixed_range":
      return "Fixed / range";
    case "project":
      return "Project-based";
    case "custom":
      return "Custom quote";
  }
}

export function ProviderProfileView({ profile }: { profile: ProviderProfile }) {
  const since = new Date(profile.memberSince).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Provider"
          title={profile.displayName}
          description={profile.headline}
          right={
            <div className="flex flex-wrap gap-2">
              <span className="polish-pill rounded-lg px-3 py-1.5 text-xs text-zinc-200">
                {profile.approved ? "Approved listing" : "Not listed"}
              </span>
              <span className="polish-pill rounded-lg px-3 py-1.5 text-xs text-zinc-400">
                Member since {since}
              </span>
            </div>
          }
        />
      </section>

      <section className="polish-section max-w-full min-w-0 rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Rates
        </h2>
        <p className="mt-2 text-lg font-medium text-zinc-100">
          {profile.rateSummary}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Model: {rateModelLabel(profile.rateModel)}
        </p>
      </section>

      <section className="polish-section max-w-full min-w-0 rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Skills
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <li key={skill}>
              <span className="polish-pill inline-block rounded-lg px-3 py-1.5 text-xs text-zinc-200">
                {skill}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="polish-section max-w-full min-w-0 rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          About
        </h2>
        <p className="mt-3 break-words text-sm leading-relaxed text-zinc-300">
          {profile.bio}
        </p>
      </section>

      {profile.links.length > 0 ? (
        <section className="polish-section max-w-full min-w-0 rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Links
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.links.map((link) => (
              <li key={link.href + link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="polish-cta-link inline-flex rounded-lg bg-zinc-900/85 px-3 py-2 text-sm text-zinc-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.proof.length > 0 ? (
        <section className="polish-section max-w-full min-w-0 rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Proof & portfolio
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {profile.proof.map((item) => (
              <li
                key={item.title}
                className="polish-trust-tile rounded-xl p-4 text-sm text-zinc-200"
              >
                <p className="font-medium text-zinc-100">{item.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {item.description}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-zinc-100"
                  >
                    View reference
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
