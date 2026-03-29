/**
 * Canonical service types shown on the marketplace (browse + filters).
 * Keep in sync with provider skills in applications / mock data.
 */

export type ServiceGroup = "Development" | "Growth" | "Community";

export type MarketplaceServiceRow = {
  name: string;
  group: ServiceGroup;
};

export const MARKETPLACE_SERVICES: MarketplaceServiceRow[] = [
  { name: "Website Designers", group: "Development" },
  { name: "Front End Developers", group: "Development" },
  { name: "Full Stack Developers", group: "Development" },
  { name: "Smart Contract Engineers", group: "Development" },
  { name: "Smart Contract Auditors", group: "Development" },
  { name: "Raid Teams", group: "Growth" },
  { name: "Marketing Managers", group: "Growth" },
  { name: "KOL Managers", group: "Growth" },
  { name: "Brand Designers", group: "Growth" },
  { name: "Community Managers", group: "Community" },
  { name: "Discord Moderators", group: "Community" },
  { name: "Telegram Moderators", group: "Community" },
  { name: "X Moderators", group: "Community" },
];

/**
 * When selected, applicant must fill `requestedServiceLabel` on the application payload.
 * Reviewers map this to an existing catalog service or add a new marketplace category.
 */
export const OTHER_SERVICE_OPTION = "Other" as const;

/** Canonical names applicants may pick without a custom label */
export const CATALOG_SERVICE_NAME_SET = new Set(
  MARKETPLACE_SERVICES.map((s) => s.name),
);

/** URL segment for `/marketplace/browse/[slug]` */
export function serviceNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const slugToName = new Map<string, string>();
for (const s of MARKETPLACE_SERVICES) {
  slugToName.set(serviceNameToSlug(s.name), s.name);
}

export function getServiceNameFromBrowseSlug(slug: string): string | undefined {
  return slugToName.get(slug);
}

export function allMarketplaceBrowseSlugs(): string[] {
  return [...slugToName.keys()];
}
