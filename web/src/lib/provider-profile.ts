/**
 * Marketplace provider profile (UI + future persistence).
 * Phase 2: mock-backed until applications and approval flow ship.
 */

export type ProviderRateModel =
  | "hourly"
  | "fixed_range"
  | "project"
  | "custom";

export type ProviderExternalLink = {
  label: string;
  href: string;
};

export type ProviderProofItem = {
  title: string;
  description: string;
  href?: string;
};

export type ProviderProfile = {
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  skills: string[];
  rateModel: ProviderRateModel;
  /** Short human-readable rate line for cards and profile hero */
  rateSummary: string;
  links: ProviderExternalLink[];
  proof: ProviderProofItem[];
  /** Manual approval gate — only approved profiles are listed publicly */
  approved: boolean;
  /** ISO date for “member since” style copy */
  memberSince: string;
};
