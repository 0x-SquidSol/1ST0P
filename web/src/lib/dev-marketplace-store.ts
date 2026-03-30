import { randomUUID } from "crypto";
import {
  applicationPayloadToProfile,
  deriveListingSlug,
} from "@/lib/application-to-profile";
import type { ProviderApplicationPayload } from "@/lib/provider-application-schema";
import { MOCK_PROVIDERS_DATA } from "@/lib/mock-providers-data";
import type { ProviderProfile } from "@/lib/provider-profile";

/**
 * Dev-only in-memory persistence (resets on cold start).
 * Replace with a real database for production deploys.
 */

export type ApplicationReviewStatus =
  | "pending"
  | "needs_info"
  | "approved"
  | "rejected";

export type ThreadAuthorRole = "system" | "applicant" | "operator";

export type ThreadMessage = {
  id: string;
  authorRole: ThreadAuthorRole;
  body: string;
  createdAt: string;
};

export type ApplicationThread = {
  id: string;
  applicationId: string;
  participantWallet: string;
  status: "open" | "closed";
  messages: ThreadMessage[];
  createdAt: string;
  updatedAt: string;
};

export type StoredApplication = {
  id: string;
  submittedAt: string;
  payload: ProviderApplicationPayload;
  reviewStatus: ApplicationReviewStatus;
  publicSlug?: string;
  approvedAt?: string;
};

const g = globalThis as unknown as {
  __1st0pApplications?: StoredApplication[];
  __1st0pThreads?: ApplicationThread[];
  __1st0pApprovedProfiles?: ProviderProfile[];
};

function applications(): StoredApplication[] {
  if (!g.__1st0pApplications) g.__1st0pApplications = [];
  return g.__1st0pApplications;
}

function threads(): ApplicationThread[] {
  if (!g.__1st0pThreads) g.__1st0pThreads = [];
  return g.__1st0pThreads;
}

function approvedProfiles(): ProviderProfile[] {
  if (!g.__1st0pApprovedProfiles) g.__1st0pApprovedProfiles = [];
  return g.__1st0pApprovedProfiles;
}

export function listApprovedApplicationProfiles(): ProviderProfile[] {
  return [...approvedProfiles()];
}

export function getApprovedProfileBySlug(
  slug: string,
): ProviderProfile | undefined {
  return approvedProfiles().find((p) => p.slug === slug);
}

function slugInUse(slug: string, excludeApplicationId?: string): boolean {
  if (MOCK_PROVIDERS_DATA.some((p) => p.slug === slug)) return true;
  return approvedProfiles().some(
    (p) =>
      p.slug === slug && p.sourceApplicationId !== excludeApplicationId,
  );
}

function allocateSlug(displayName: string, applicationId: string): string {
  let slug = deriveListingSlug(displayName, applicationId);
  let n = 0;
  while (slugInUse(slug, applicationId)) {
    n += 1;
    slug = `${deriveListingSlug(displayName, applicationId)}-${n}`;
  }
  return slug;
}

const MAX_APPLICATIONS = 500;

export function addApplicationWithThread(
  payload: ProviderApplicationPayload,
): { applicationId: string; threadId: string } {
  const store = applications();
  if (store.length >= MAX_APPLICATIONS) {
    const removed = store.shift();
    if (removed) {
      const tl = threads();
      const ti = tl.findIndex((x) => x.applicationId === removed.id);
      if (ti >= 0) tl.splice(ti, 1);
    }
  }

  const applicationId = randomUUID();
  const threadId = randomUUID();
  const submittedAt = new Date().toISOString();

  store.push({
    id: applicationId,
    submittedAt,
    payload,
    reviewStatus: "pending",
  });

  const systemBody =
    "Your provider application was received. A reviewer may reply here with questions or a decision. Use the same wallet you used on the application to open Messages.";

  threads().push({
    id: threadId,
    applicationId,
    participantWallet: payload.applicantWallet,
    status: "open",
    messages: [
      {
        id: randomUUID(),
        authorRole: "system",
        body: systemBody,
        createdAt: submittedAt,
      },
    ],
    createdAt: submittedAt,
    updatedAt: submittedAt,
  });

  return { applicationId, threadId };
}

export function getApplicationById(id: string): StoredApplication | undefined {
  return applications().find((a) => a.id === id);
}

export function listThreadsForWallet(wallet: string): ApplicationThread[] {
  return threads().filter((t) => t.participantWallet === wallet);
}

export function getThreadById(id: string): ApplicationThread | undefined {
  return threads().find((t) => t.id === id);
}

export function listAllThreads(): ApplicationThread[] {
  return [...threads()];
}

export function appendMessage(
  threadId: string,
  role: Exclude<ThreadAuthorRole, "system">,
  body: string,
): ThreadMessage | null {
  const t = getThreadById(threadId);
  if (!t || t.status === "closed") return null;
  const msg: ThreadMessage = {
    id: randomUUID(),
    authorRole: role,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  t.messages.push(msg);
  t.updatedAt = msg.createdAt;
  return msg;
}

export function setThreadStatus(
  threadId: string,
  status: "open" | "closed",
): ApplicationThread | null {
  const t = getThreadById(threadId);
  if (!t) return null;
  t.status = status;
  t.updatedAt = new Date().toISOString();
  return t;
}

export function listStoredApplications(): StoredApplication[] {
  return [...applications()].sort((a, b) =>
    a.submittedAt < b.submittedAt ? 1 : -1,
  );
}

function removeApprovedProfileForApplication(applicationId: string): void {
  const list = approvedProfiles();
  const idx = list.findIndex((p) => p.sourceApplicationId === applicationId);
  if (idx >= 0) list.splice(idx, 1);
}

export function approveStoredApplication(
  id: string,
): { slug: string } | { error: string } {
  const app = getApplicationById(id);
  if (!app) return { error: "not found" };
  if (app.reviewStatus === "rejected") return { error: "rejected" };
  if (app.reviewStatus === "approved" && app.publicSlug) {
    return { slug: app.publicSlug };
  }

  removeApprovedProfileForApplication(id);

  const slug = allocateSlug(app.payload.displayName, app.id);
  const profile = applicationPayloadToProfile(app.payload, slug, app.id);
  approvedProfiles().push(profile);
  app.reviewStatus = "approved";
  app.publicSlug = slug;
  app.approvedAt = new Date().toISOString();
  return { slug };
}

export function rejectStoredApplication(
  id: string,
): { ok: true } | { error: string } {
  const app = getApplicationById(id);
  if (!app) return { error: "not found" };
  removeApprovedProfileForApplication(id);
  app.reviewStatus = "rejected";
  app.publicSlug = undefined;
  app.approvedAt = undefined;
  return { ok: true };
}

export function markApplicationNeedsInfo(
  id: string,
): { ok: true } | { error: string } {
  const app = getApplicationById(id);
  if (!app) return { error: "not found" };
  if (app.reviewStatus === "approved") {
    return { error: "approve or reject before changing to needs info" };
  }
  app.reviewStatus = "needs_info";
  return { ok: true };
}

export function markApplicationPending(
  id: string,
): { ok: true } | { error: string } {
  const app = getApplicationById(id);
  if (!app) return { error: "not found" };
  if (app.reviewStatus === "approved") {
    return { error: "cannot set pending on approved application" };
  }
  app.reviewStatus = "pending";
  return { ok: true };
}
