import type { ProviderProfile } from "@/lib/provider-profile";

export const MOCK_PROVIDERS: ProviderProfile[] = [
  {
    slug: "nexus-labs",
    displayName: "Nexus Labs",
    headline: "Full-stack Solana products, audits, and launch support",
    bio: "Small studio focused on Anchor programs, Next.js dashboards, and bonding-curve launches. We ship with tests, IDL docs, and handoff calls so your team owns the codebase.",
    skills: [
      "Smart Contract Engineers",
      "Full Stack Developers",
      "Smart Contract Auditors",
    ],
    rateModel: "hourly",
    rateSummary: "$95–140/hr · project quotes for fixed scope",
    links: [
      { label: "Website", href: "https://example.com" },
      { label: "X", href: "https://x.com" },
      { label: "GitHub", href: "https://github.com" },
    ],
    proof: [
      {
        title: "Bonding curve + treasury dashboard",
        description:
          "Devnet launchpad integration with real-time curve stats and admin fee controls.",
        href: "https://github.com",
      },
      {
        title: "Anchor program hardening",
        description:
          "Constraint review, PDA documentation, and fuzzing checklist for a DeFi protocol.",
      },
    ],
    approved: true,
    memberSince: "2025-11-01",
  },
  {
    slug: "signal-growth",
    displayName: "Signal Growth",
    headline: "Raids, KOL coordination, and launch-week narrative",
    bio: "We run structured raid windows, moderator briefings, and creator outreach so launches don’t depend on a single thread. Reporting is written for founders who need receipts, not vibes.",
    skills: ["Raid Teams", "KOL Managers", "Marketing Managers", "X Moderators"],
    rateModel: "project",
    rateSummary: "From 12 SOL / launch week (custom packages)",
    links: [
      { label: "Website", href: "https://example.com" },
      { label: "Portfolio deck", href: "https://example.com" },
    ],
    proof: [
      {
        title: "Multi-day raid playbook",
        description:
          "Template used for three devnet launches: slot owners, escalation path, and daily metrics snapshot.",
      },
    ],
    approved: true,
    memberSince: "2025-12-15",
  },
  {
    slug: "quiet-dev",
    displayName: "Quiet Dev (pending)",
    headline: "Placeholder — not publicly listed until approved",
    bio: "This row exists to show that unapproved applications stay off the public directory. Replace with real intake once the application queue ships.",
    skills: ["Front End Developers"],
    rateModel: "custom",
    rateSummary: "TBD after scoping call",
    links: [{ label: "X", href: "https://x.com" }],
    proof: [],
    approved: false,
    memberSince: "2026-01-20",
  },
];

export function listPublicProviders(): ProviderProfile[] {
  return MOCK_PROVIDERS.filter((p) => p.approved);
}

export function getProviderBySlug(slug: string): ProviderProfile | undefined {
  return MOCK_PROVIDERS.find((p) => p.slug === slug);
}
