import { randomUUID } from "crypto";
import {
  applicationPayloadToProfile,
  deriveListingSlug,
} from "@/lib/application-to-profile";
import type { ProviderApplicationPayload } from "@/lib/provider-application-schema";
import { MOCK_PROVIDERS_DATA } from "@/lib/mock-providers-data";
import type { ProviderProfile } from "@/lib/provider-profile";
import { computeFeeBreakdown } from "@/lib/marketplace-fees";

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

/**
 * Deal status flow:
 *   open        → chat started, no agreement yet
 *   drafting    → someone opened the agreement editor
 *   locked      → agreement locked, waiting for both signatures
 *   active      → both signed, work in progress
 *   completed   → all milestones released
 *   disputed    → at least one milestone flagged
 *   cancelled   → either party walked away before lock
 */
export type DealStatus =
  | "open"
  | "drafting"
  | "locked"
  | "active"
  | "completed"
  | "disputed"
  | "cancelled";

export type DealMessageAuthorRole = "system" | "buyer" | "provider" | "operator";

export type DealMessage = {
  id: string;
  authorRole: DealMessageAuthorRole;
  body: string;
  createdAt: string;
};

export type DealAgreement = {
  /** Locked to the service the buyer clicked Hire on. */
  serviceType: string;
  /** Full scope / terms of the contract. */
  scopeDetails: string;
  /** Free-text timeline description. */
  timeline: string;
  /** Total cost in SOL — held in escrow, paid on completion. */
  totalCostSol: number;
  /** Who last edited the draft. */
  lastEditedBy: "buyer" | "provider" | null;
  lastEditedAt: string | null;
  /** Lock: freeze edits, allow signing. */
  lockedBy: "buyer" | "provider" | null;
  lockedAt: string | null;
  /** Signatures (only possible after lock). */
  buyerSignedAt: string | null;
  providerSignedAt: string | null;
  /** Fee snapshot computed at lock time. */
  feeSnapshot: {
    serviceTotalSol: number;
    platformFeeSol: number;
    totalReleaseFeeSol: number;
    estimatedNetworkFeeSol: number;
    grandTotalSol: number;
  } | null;
};

export type DealThread = {
  id: string;
  providerSlug: string;
  providerDisplayName: string;
  serviceName: string;
  buyerWallet: string;
  providerWallet: string;
  status: DealStatus;
  agreement: DealAgreement | null;
  messages: DealMessage[];
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
  __1st0pDeals?: DealThread[];
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

function deals(): DealThread[] {
  if (!g.__1st0pDeals) g.__1st0pDeals = [];
  return g.__1st0pDeals;
}

export function listApprovedApplicationProfiles(): ProviderProfile[] {
  return [...approvedProfiles()];
}

export function getApprovedProfileBySlug(
  slug: string,
): ProviderProfile | undefined {
  return approvedProfiles().find((p) => p.slug === slug);
}

export function getProviderWalletForSlug(slug: string): string | null {
  const p = getApprovedProfileBySlug(slug);
  if (!p?.sourceApplicationId) return null;
  const app = getApplicationById(p.sourceApplicationId);
  return app?.payload.applicantWallet ?? null;
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

export function createDealThread(input: {
  providerSlug: string;
  providerDisplayName: string;
  serviceName: string;
  buyerWallet: string;
  providerWallet: string;
}): DealThread {
  const now = new Date().toISOString();
  const thread: DealThread = {
    id: randomUUID(),
    providerSlug: input.providerSlug,
    providerDisplayName: input.providerDisplayName,
    serviceName: input.serviceName,
    buyerWallet: input.buyerWallet,
    providerWallet: input.providerWallet,
    status: "open",
    agreement: null,
    messages: [
      {
        id: randomUUID(),
        authorRole: "system",
        body: "Deal chat started. Discuss the scope and terms here, then open the agreement to draft milestones and lock it in.",
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  deals().push(thread);
  return thread;
}

export function listDealThreadsForWallet(wallet: string): DealThread[] {
  return deals()
    .filter((d) => d.buyerWallet === wallet || d.providerWallet === wallet)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getDealThreadById(id: string): DealThread | undefined {
  return deals().find((d) => d.id === id);
}

export function appendDealMessage(
  dealId: string,
  role: Exclude<DealMessageAuthorRole, "system">,
  body: string,
): DealMessage | null {
  const d = getDealThreadById(dealId);
  if (!d) return null;
  const msg: DealMessage = {
    id: randomUUID(),
    authorRole: role,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  d.messages.push(msg);
  d.updatedAt = msg.createdAt;
  return msg;
}

export function setDealStatus(
  dealId: string,
  status: DealStatus,
): DealThread | null {
  const d = getDealThreadById(dealId);
  if (!d) return null;
  d.status = status;
  d.updatedAt = new Date().toISOString();
  return d;
}

/* ------------------------------------------------------------------ */
/*  Agreement: draft → lock → sign                                     */
/* ------------------------------------------------------------------ */

/** Save or update the agreement draft. Resets lock + signatures. */
export function saveDraftAgreement(
  dealId: string,
  role: "buyer" | "provider",
  draft: {
    serviceType: string;
    scopeDetails: string;
    timeline: string;
    totalCostSol: number;
  },
): DealThread | { error: string } {
  const d = getDealThreadById(dealId);
  if (!d) return { error: "not found" };
  if (d.status !== "open" && d.status !== "drafting")
    return { error: "cannot edit agreement in current state" };

  const now = new Date().toISOString();

  d.agreement = {
    serviceType: draft.serviceType,
    scopeDetails: draft.scopeDetails,
    timeline: draft.timeline,
    totalCostSol: draft.totalCostSol,
    lastEditedBy: role,
    lastEditedAt: now,
    lockedBy: null,
    lockedAt: null,
    buyerSignedAt: null,
    providerSignedAt: null,
    feeSnapshot: null,
  };
  d.status = "drafting";
  d.updatedAt = now;

  const who = role === "buyer" ? "Buyer" : "Provider";
  d.messages.push({
    id: randomUUID(),
    authorRole: "system",
    body: `${who} updated the contract draft.`,
    createdAt: now,
  });

  return d;
}

/** Lock the agreement — freeze all edits, compute fees. */
export function lockAgreement(
  dealId: string,
  role: "buyer" | "provider",
): DealThread | { error: string } {
  const d = getDealThreadById(dealId);
  if (!d) return { error: "not found" };
  if (d.status !== "drafting") return { error: "nothing to lock" };
  if (!d.agreement) return { error: "no draft agreement" };
  if (d.agreement.totalCostSol <= 0) return { error: "total cost must be greater than 0" };
  if (d.agreement.lockedAt) return { error: "already locked" };

  const now = new Date().toISOString();
  const fb = computeFeeBreakdown([d.agreement.totalCostSol]);

  d.agreement.lockedBy = role;
  d.agreement.lockedAt = now;
  d.agreement.feeSnapshot = {
    serviceTotalSol: fb.serviceTotalSol,
    platformFeeSol: fb.platformFeeSol,
    totalReleaseFeeSol: fb.totalReleaseFeeSol,
    estimatedNetworkFeeSol: fb.estimatedNetworkFeeSol,
    grandTotalSol: fb.grandTotalSol,
  };
  d.status = "locked";
  d.updatedAt = now;

  const who = role === "buyer" ? "Buyer" : "Provider";
  d.messages.push({
    id: randomUUID(),
    authorRole: "system",
    body: `${who} locked the contract. Both parties must now sign to activate.`,
    createdAt: now,
  });

  return d;
}

/** Unlock agreement back to drafting (resets signatures). */
export function unlockAgreement(
  dealId: string,
  role: "buyer" | "provider",
): DealThread | { error: string } {
  const d = getDealThreadById(dealId);
  if (!d) return { error: "not found" };
  if (d.status !== "locked") return { error: "not locked" };
  if (!d.agreement) return { error: "no agreement" };

  const now = new Date().toISOString();
  d.agreement.lockedBy = null;
  d.agreement.lockedAt = null;
  d.agreement.buyerSignedAt = null;
  d.agreement.providerSignedAt = null;
  d.agreement.feeSnapshot = null;
  d.status = "drafting";
  d.updatedAt = now;

  const who = role === "buyer" ? "Buyer" : "Provider";
  d.messages.push({
    id: randomUUID(),
    authorRole: "system",
    body: `${who} unlocked the agreement for further edits.`,
    createdAt: now,
  });

  return d;
}

/** Sign a locked agreement. Both must sign → status becomes active. */
export function signAgreement(
  dealId: string,
  role: "buyer" | "provider",
): DealThread | { error: string } {
  const d = getDealThreadById(dealId);
  if (!d) return { error: "not found" };
  if (d.status !== "locked") return { error: "agreement must be locked first" };
  if (!d.agreement || !d.agreement.lockedAt) return { error: "not locked" };

  const now = new Date().toISOString();

  if (role === "buyer") {
    if (d.agreement.buyerSignedAt) return { error: "buyer already signed" };
    d.agreement.buyerSignedAt = now;
  } else {
    if (d.agreement.providerSignedAt) return { error: "provider already signed" };
    d.agreement.providerSignedAt = now;
  }
  d.updatedAt = now;

  if (d.agreement.buyerSignedAt && d.agreement.providerSignedAt) {
    d.status = "active";
    d.messages.push({
      id: randomUUID(),
      authorRole: "system",
      body: "Both parties signed. Agreement is active — buyer: fund escrow to begin work.",
      createdAt: now,
    });
  } else {
    const who = role === "buyer" ? "Buyer" : "Provider";
    d.messages.push({
      id: randomUUID(),
      authorRole: "system",
      body: `${who} signed the agreement. Waiting for the other party.`,
      createdAt: now,
    });
  }

  return d;
}

/** List all deals (admin dashboard). */
export function listAllDeals(): DealThread[] {
  return [...deals()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}
