import type { ProviderProfile } from "@/lib/provider-profile";

/** Approved providers who list this exact service (offering) on their profile */
export function providersOfferingService(
  approved: ProviderProfile[],
  serviceName: string,
): ProviderProfile[] {
  return approved.filter((p) =>
    p.offerings.some((o) => o.serviceName === serviceName),
  );
}

/** Aligns with marketplace service category pills for [filter] consistency */
export type ProviderBrowseScope = "All" | "Development" | "Growth" | "Community";

const SKILL_GROUP: Record<string, Exclude<ProviderBrowseScope, "All">> = {
  "Website Designers": "Development",
  "Front End Developers": "Development",
  "Full Stack Developers": "Development",
  "Smart Contract Engineers": "Development",
  "Smart Contract Auditors": "Development",
  "Raid Teams": "Growth",
  "Marketing Managers": "Growth",
  "KOL Managers": "Growth",
  "Brand Designers": "Growth",
  "Community Managers": "Community",
  "Discord Moderators": "Community",
  "Telegram Moderators": "Community",
  "X Moderators": "Community",
};

export function groupsForProvider(p: ProviderProfile): Set<Exclude<ProviderBrowseScope, "All">> {
  const g = new Set<Exclude<ProviderBrowseScope, "All">>();
  for (const o of p.offerings) {
    const gg = SKILL_GROUP[o.serviceName];
    if (gg) g.add(gg);
  }
  return g;
}

export function providerMatchesScope(
  p: ProviderProfile,
  scope: ProviderBrowseScope,
): boolean {
  if (scope === "All") return true;
  return groupsForProvider(p).has(scope);
}
