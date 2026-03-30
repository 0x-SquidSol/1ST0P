import type { ProviderProfile } from "@/lib/provider-profile";

/** Static sample rows — no runtime store imports (avoids circular deps). */
export const MOCK_PROVIDERS_DATA: ProviderProfile[] = [
  {
    slug: "nexus-labs",
    displayName: "Nexus Labs",
    headline: "Full-stack Solana products, audits, and launch support",
    bio: "Small studio focused on Anchor programs, Next.js dashboards, and bonding-curve launches. We ship with tests, IDL docs, and handoff calls so your team owns the codebase.",
    socialLinks: {
      website: "https://example.com",
      x: "https://x.com",
      github: "https://github.com",
    },
    offerings: [
      {
        serviceName: "Smart Contract Engineers",
        tags: ["Anchor", "Rust", "PDAs", "CPI patterns"],
        rateModel: "hourly",
        rateSummary: "$95–140/hr · scoped milestones available",
        listingRating: 5,
        reviewCount: 1,
      },
      {
        serviceName: "Full Stack Developers",
        tags: ["Next.js", "Solana web3.js", "Dashboards"],
        rateModel: "project",
        rateSummary: "From 18 SOL fixed for MVP dashboards",
        listingRating: 4.8,
        reviewCount: 4,
      },
      {
        serviceName: "Smart Contract Auditors",
        tags: ["Constraint review", "Threat modeling", "Reports"],
        rateModel: "fixed_range",
        rateSummary: "$4k–12k per program depending on LOC",
        listingRating: 5,
        reviewCount: 1,
      },
    ],
    approved: true,
    memberSince: "2025-11-01",
    listingRating: 4.9,
    reviewCount: 12,
  },
  {
    slug: "signal-growth",
    displayName: "Signal Growth",
    headline: "Raids, KOL coordination, and launch-week narrative",
    bio: "We run structured raid windows, moderator briefings, and creator outreach so launches don’t depend on a single thread. Reporting is written for founders who need receipts, not vibes.",
    socialLinks: {
      website: "https://example.com",
      x: "https://x.com",
    },
    offerings: [
      {
        serviceName: "Raid Teams",
        tags: ["Window planning", "Slot owners", "Daily metrics"],
        rateModel: "project",
        rateSummary: "From 8 SOL / raid week",
        listingRating: 4.9,
        reviewCount: 3,
      },
      {
        serviceName: "KOL Managers",
        tags: ["Creator outreach", "Briefing docs", "Timezone coverage"],
        rateModel: "project",
        rateSummary: "From 15 SOL / launch arc",
        listingRating: 4.6,
        reviewCount: 2,
      },
      {
        serviceName: "Marketing Managers",
        tags: ["Narrative", "Launch calendar", "Investor updates"],
        rateModel: "custom",
        rateSummary: "Custom retainers after scoping call",
        listingRating: 4.5,
        reviewCount: 1,
      },
    ],
    approved: true,
    memberSince: "2025-12-15",
    listingRating: 4.7,
    reviewCount: 8,
  },
  {
    slug: "quiet-dev",
    displayName: "Quiet Dev (pending)",
    headline: "Placeholder — not publicly listed until approved",
    bio: "This row exists to show that unapproved applications stay off the public directory. Replace with real intake once the application queue ships.",
    socialLinks: {
      x: "https://x.com",
    },
    offerings: [
      {
        serviceName: "Front End Developers",
        tags: ["React", "Design systems"],
        rateModel: "custom",
        rateSummary: "TBD after scoping call",
      },
    ],
    approved: false,
    memberSince: "2026-01-20",
  },
];
