import type { ProviderSocialLinks } from "@/lib/provider-profile";

const SLOTS: { key: keyof ProviderSocialLinks; label: string }[] = [
  { key: "website", label: "Website" },
  { key: "x", label: "X" },
  { key: "github", label: "GitHub" },
];

type Props = {
  socialLinks: ProviderSocialLinks;
};

export function ProviderHeaderSocial({ socialLinks }: Props) {
  return (
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Provider links">
      {SLOTS.map(({ key, label }) => {
        const href = socialLinks[key];
        if (href) {
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-white/14 bg-zinc-900/90 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-white/25 hover:bg-zinc-800/95"
            >
              {label}
            </a>
          );
        }
        return (
          <span
            key={key}
            className="inline-flex cursor-not-allowed rounded-lg border border-white/[0.06] bg-zinc-950/40 px-4 py-2 text-sm font-medium text-zinc-600"
            title="Not added for this listing — at least one link is required when you apply"
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
