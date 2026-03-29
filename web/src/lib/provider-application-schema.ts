import { z } from "zod";
import {
  CATALOG_SERVICE_NAME_SET,
  OTHER_SERVICE_OPTION,
} from "@/lib/marketplace-services";

export const providerRateModelSchema = z.enum([
  "hourly",
  "fixed_range",
  "project",
  "custom",
]);

function offeringUniquenessKey(o: {
  serviceName: string;
  requestedServiceLabel?: string | undefined;
}): string {
  if (o.serviceName === OTHER_SERVICE_OPTION) {
    return `other:${(o.requestedServiceLabel ?? "").trim().toLowerCase()}`;
  }
  return o.serviceName;
}

const offeringSchema = z
  .object({
    serviceName: z.string().min(1, "Pick a service"),
    requestedServiceLabel: z.string().max(120).optional(),
    tags: z.array(z.string().min(1).max(48)).max(10),
    rateModel: providerRateModelSchema,
    rateSummary: z.string().min(4).max(220),
  })
  .superRefine((data, ctx) => {
    if (data.serviceName === OTHER_SERVICE_OPTION) {
      const t = data.requestedServiceLabel?.trim() ?? "";
      if (t.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Describe the service (at least 3 characters)",
          path: ["requestedServiceLabel"],
        });
      }
    } else if (!CATALOG_SERVICE_NAME_SET.has(data.serviceName)) {
      ctx.addIssue({
        code: "custom",
        message: "Pick a marketplace service from the list or choose Other",
        path: ["serviceName"],
      });
    }
  });

const proofItemSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().min(12).max(4000),
  href: z.string().max(2048).optional(),
});

function isValidHttpUrl(s: string): boolean {
  try {
    const u = s.startsWith("http://") || s.startsWith("https://") ? s : `https://${s}`;
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

/** Base58 Solana public key (typical length ~43–44). */
const applicantWalletSchema = z
  .string()
  .min(32, "Wallet address invalid")
  .max(64, "Wallet address invalid");

export const providerApplicationSchema = z
  .object({
    applicantWallet: applicantWalletSchema,
    displayName: z.string().min(2).max(120),
    headline: z.string().min(8).max(160),
    bio: z.string().min(40).max(8000),
    offerings: z.array(offeringSchema).min(1).max(3),
    proof: z.array(proofItemSchema).max(8),
    priorDeliveryNotes: z.string().max(2000).optional(),
    socialLinks: z.object({
      website: z.string().max(500).optional(),
      x: z.string().max(500).optional(),
      github: z.string().max(500).optional(),
    }),
    acknowledgements: z.object({
      escrowUntilComplete: z.literal(true),
      buyerReviewAfterWork: z.literal(true),
    }),
  })
  .superRefine((data, ctx) => {
    const keys = data.offerings.map(offeringUniquenessKey);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: "custom",
        message: "Each service row must be unique (including two different “Other” descriptions)",
        path: ["offerings"],
      });
    }
    const links = [
      data.socialLinks.website,
      data.socialLinks.x,
      data.socialLinks.github,
    ].filter((s) => s?.trim());
    if (links.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Add at least one URL for Website, X, or GitHub",
        path: ["socialLinks", "website"],
      });
    }
    (
      [
        ["website", data.socialLinks.website],
        ["x", data.socialLinks.x],
        ["github", data.socialLinks.github],
      ] as const
    ).forEach(([key, raw]) => {
      if (raw?.trim() && !isValidHttpUrl(raw.trim())) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid URL",
          path: ["socialLinks", key],
        });
      }
    });
    data.proof.forEach((p, i) => {
      if (p.href?.trim() && !isValidHttpUrl(p.href.trim())) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid portfolio URL",
          path: ["proof", i, "href"],
        });
      }
    });
  });

export type ProviderApplicationPayload = z.infer<typeof providerApplicationSchema>;
