import type { ProviderApplicationPayload } from "@/lib/provider-application-schema";
import { OTHER_SERVICE_OPTION } from "@/lib/marketplace-services";
import type { ProviderProfile, ProviderServiceOffering } from "@/lib/provider-profile";

function offeringsFromPayload(
  payload: ProviderApplicationPayload,
): ProviderServiceOffering[] {
  return payload.offerings.map((o) => {
    let serviceName = o.serviceName;
    if (serviceName === OTHER_SERVICE_OPTION && o.requestedServiceLabel?.trim()) {
      serviceName = `Other (${o.requestedServiceLabel.trim()})`;
    }
    const row: ProviderServiceOffering = {
      serviceName,
      tags: o.tags,
      rateModel: o.rateModel,
      rateSummary: o.rateSummary,
    };
    return row;
  });
}

export function applicationPayloadToProfile(
  payload: ProviderApplicationPayload,
  slug: string,
  sourceApplicationId: string,
): ProviderProfile {
  const approvedAt = new Date().toISOString().slice(0, 10);
  return {
    slug,
    displayName: payload.displayName.trim(),
    headline: payload.headline.trim(),
    bio: payload.bio.trim(),
    offerings: offeringsFromPayload(payload),
    socialLinks: {
      website: payload.socialLinks.website?.trim() || undefined,
      x: payload.socialLinks.x?.trim() || undefined,
      github: payload.socialLinks.github?.trim() || undefined,
    },
    approved: true,
    memberSince: approvedAt,
    sourceApplicationId,
  };
}

export function deriveListingSlug(displayName: string, applicationId: string): string {
  const base = displayName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const safeBase = base || "provider";
  return `${safeBase}-${applicationId.replace(/-/g, "").slice(0, 10)}`;
}
