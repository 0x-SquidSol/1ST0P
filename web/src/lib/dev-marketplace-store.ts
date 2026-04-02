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

export type DealReviewStatus =
  | "proposed"
  | "changes_requested"
  | "accepted"
  | "declined"
  | "agreement_pending"
  | "active"
  | "completed"
  | "disputed";

export type DealMessageAuthorRole = "system" | "buyer" | "provider" | "operator";

export type DealMessage = {
  id: string;
  authorRole: DealMessageAuthorRole;
  body: string;
  createdAt: string;
};

export type MilestoneEscrowStatus =
  | "pending"
  | "in_progress"
  | "released"
  | "disputed";

export type DealMilestone = {
  id: string;
  title: string;
  deliverable: string;
  amountSol: number;
  dueDate: string;
  escrowStatus: MilestoneEscrowStatus;
};

export type DealProposal = {
  projectTitle: string;
  scopeSummary: string;
  startDate: string;
  targetDate: string;
  notes?: string;
  milestones: DealMilestone[];
};

export type DealAgreement = {
  buyerSignedAt: string | null;
  providerSignedAt: string | null;
  feeSnapshot: {
    serviceTotalSol: number;
    platformFeeSol: number;
    totalReleaseFeeSol: number;
    estimatedNetworkFeeSol: number;
    grandTotalSol: number;
  };
};

export type DealThread = {
  id: string;
  providerSlug: string;
  providerDisplayName: string;
  serviceName: string;
  buyerWallet: string;
  providerWallet: string;
  status: DealReviewStatus;
  proposal: DealProposal;
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
  proposal: DealProposal;
}): DealThread {
  const now = new Date().toISOString();
  const thread: DealThread = {
    id: randomUUID(),
    providerSlug: input.providerSlug,
    providerDisplayName: input.providerDisplayName,
    serviceName: input.serviceName,
    buyerWallet: input.buyerWallet,
    providerWallet: input.providerWallet,
    status: "proposed",
    proposal: input.proposal,
    agreement: null,
    messages: [
      {
        id: randomUUID(),
        authorRole: "system",
        body: "Deal thread created. Provider can accept, request changes, or decline this proposal.",
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
  status: DealReviewStatus,
): DealThread | null {
  const d = getDealThreadById(dealId);
  if (!d) return null;
  d.status = status;
  d.updatedAt = new Date().toISOString();
  return d;
}

/* ------------------------------------------------------------------ */
/*  Agreement + escrow helpers                                         */
/* ------------------------------------------------------------------ */

/**
 * Move an accepted deal into agreement_pending and snapshot fees.
 * Called when the provider accepts — both parties must then sign.
 */
export function initAgreement(
  dealId: string,
): DealThread | { error: string } {
  const d = getDealThreadById(dealId);
  if (!d) return { error: "not found" };
  if (d.status !== "accepted") return { error: "deal must be accepted first" };

  const amounts = d.proposal.milestones.map((m) => m.amountSol);
  const fb = computeFeeBreakdown(amounts);

  d.agreement = {
    buyerSignedAt: null,
    providerSignedAt: null,
    feeSnapshot: {
      serviceTotalSol: fb.serviceTotalSol,
      platformFeeSol: fb.platformFeeSol,
      totalReleaseFeeSol: fb.totalReleaseFeeSol,
      estimatedNetworkFeeSol: fb.estimatedNetworkFeeSol,
      grandTotalSol: fb.grandTotalSol,
    },
  };
  d.status = "agreement_pending";
  d.updatedAt = new Date().toISOString();

  // Set all milestones to pending escrow
  for (const m of d.proposal.milestones) {
    m.escrowStatus = "pending";
  }

  appendDealMessage(dealId, "system" as never, "");
  // Replace the empty message with a proper system message
  const sysMsg = d.messages[d.messages.length - 1];
  if (sysMsg) {
    sysMsg.authorRole = "system";
    sysMsg.body =
      "Provider accepted the proposal. Both parties must now review and sign the agreement before work begins.";
  }

  return d;
}

/**
 * Record a party's signature on the agreement.
 * When both have signed → status becomes "active".
 */
export function signAgreement(
  dealId: string,
  role: "buyer" | "provider",
): DealThread | { error: string } {
  const d = getDealThreadById(dealId);
  if (!d) return { error: "not found" };
  if (d.status !== "agreement_pending") return { error: "no pending agreement" };
  if (!d.agreement) return { error: "agreement not initialized" };

  const now = new Date().toISOString();

  if (role === "buyer") {
    if (d.agreement.buyerSignedAt) return { error: "buyer already signed" };
    d.agreement.buyerSignedAt = now;
  } else {
    if (d.agreement.providerSignedAt) return { error: "provider already signed" };
    d.agreement.providerSignedAt = now;
  }

  d.updatedAt = now;

  // Both signed → activate + prompt buyer for payment
  if (d.agreement.buyerSignedAt && d.agreement.providerSignedAt) {
    d.status = "active";
    const sysMsg: DealMessage = {
      id: randomUUID(),
      authorRole: "system",
      body: "Both parties signed the agreement. Buyer: please fund the escrow to begin work.",
      createdAt: now,
    };
    d.messages.push(sysMsg);
  } else {
    const who = role === "buyer" ? "Buyer" : "Provider";
    const sysMsg: DealMessage = {
      id: randomUUID(),
      authorRole: "system",
      body: `${who} signed the agreement. Waiting for the other party.`,
      createdAt: now,
    };
    d.messages.push(sysMsg);
  }

  return d;
}

/**
 * Update a milestone's escrow status (e.g. pending → in_progress → released).
 */
export function updateMilestoneEscrow(
  dealId: string,
  milestoneId: string,
  escrowStatus: MilestoneEscrowStatus,
): DealThread | { error: string } {
  const d = getDealThreadById(dealId);
  if (!d) return { error: "not found" };
  if (d.status !== "active" && d.status !== "disputed")
    return { error: "deal must be active" };

  const m = d.proposal.milestones.find((ms) => ms.id === milestoneId);
  if (!m) return { error: "milestone not found" };

  m.escrowStatus = escrowStatus;
  d.updatedAt = new Date().toISOString();

  // If all milestones released → mark deal completed
  const allReleased = d.proposal.milestones.every(
    (ms) => ms.escrowStatus === "released",
  );
  if (allReleased) {
    d.status = "completed";
    const sysMsg: DealMessage = {
      id: randomUUID(),
      authorRole: "system",
      body: "All milestones released. This engagement is now complete.",
      createdAt: d.updatedAt,
    };
    d.messages.push(sysMsg);
  }

  return d;
}

/** List all deals (for admin dashboard). */
export function listAllDeals(): DealThread[] {
  return [...deals()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}
