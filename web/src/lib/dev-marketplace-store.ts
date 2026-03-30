import { randomUUID } from "crypto";
import type { ProviderApplicationPayload } from "@/lib/provider-application-schema";

/**
 * Dev-only in-memory persistence (resets on cold start).
 * Phase 6: replace with DB; Phase 2 commit 7: admin queue reads same records.
 */

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
};

const g = globalThis as unknown as {
  __1st0pApplications?: StoredApplication[];
  __1st0pThreads?: ApplicationThread[];
};

function applications(): StoredApplication[] {
  if (!g.__1st0pApplications) g.__1st0pApplications = [];
  return g.__1st0pApplications;
}

function threads(): ApplicationThread[] {
  if (!g.__1st0pThreads) g.__1st0pThreads = [];
  return g.__1st0pThreads;
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

  store.push({ id: applicationId, submittedAt, payload });

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
