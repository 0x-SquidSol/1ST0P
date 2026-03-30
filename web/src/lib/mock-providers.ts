import {
  getApprovedProfileBySlug,
  listApprovedApplicationProfiles,
} from "@/lib/dev-marketplace-store";
import { MOCK_PROVIDERS_DATA } from "@/lib/mock-providers-data";
import type { ProviderProfile } from "@/lib/provider-profile";

export const MOCK_PROVIDERS: ProviderProfile[] = MOCK_PROVIDERS_DATA;

export function listPublicProviders(): ProviderProfile[] {
  const fromMock = MOCK_PROVIDERS.filter((p) => p.approved);
  const fromApplications = listApprovedApplicationProfiles();
  return [...fromMock, ...fromApplications];
}

export function getProviderBySlug(slug: string): ProviderProfile | undefined {
  return (
    MOCK_PROVIDERS.find((p) => p.slug === slug) ??
    getApprovedProfileBySlug(slug)
  );
}
