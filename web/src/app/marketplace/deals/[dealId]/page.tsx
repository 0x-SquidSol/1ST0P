"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DealThread } from "@/lib/dev-marketplace-store";
import { PageHeader } from "@/components/PageHeader";
import { AgreementModal } from "@/components/AgreementModal";

type DealApi = {
  deal: DealThread;
  participantRole: "buyer" | "provider";
};

const ESCROW_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  released: "Released",
  disputed: "Disputed",
};

const ESCROW_COLORS: Record<string, string> = {
  pending: "bg-zinc-700 text-zinc-300",
  in_progress: "bg-amber-500/20 text-amber-300",
  released: "bg-emerald-500/20 text-emerald-300",
  disputed: "bg-red-500/20 text-red-300",
};

export default function DealThreadPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = typeof params.dealId === "string" ? params.dealId : "";

  const [deal, setDeal] = useState<DealThread | null>(null);
  const [role, setRole] = useState<"buyer" | "provider" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  const totalSol = useMemo(() => {
    if (!deal) return 0;
    return deal.proposal.milestones.reduce((acc, m) => acc + m.amountSol, 0);
  }, [deal]);

  const load = useCallback(async () => {
    if (!dealId) return;
    setErr(null);
    const res = await fetch(`/api/marketplace/deals/${dealId}`, {
      credentials: "include",
    });
    if (res.status === 401) {
      router.replace("/marketplace/deals");
      return;
    }
    if (res.status === 404) {
      setErr("Deal thread not found.");
      setDeal(null);
      return;
    }
    if (!res.ok) {
      setErr("Could not load deal thread.");
      return;
    }
    const data = (await res.json()) as DealApi;
    setDeal(data.deal);
    setRole(data.participantRole);
  }, [dealId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const t = body.trim();
    if (!t || !dealId) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch(`/api/marketplace/deals/${dealId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: t }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Message failed.");
        return;
      }
      const data = (await res.json()) as DealApi;
      setDeal(data.deal);
      setRole(data.participantRole);
      setBody("");
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(status: "accepted" | "changes_requested" | "declined") {
    if (!dealId) return;
    setStatusBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/marketplace/deals/${dealId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Status update failed.");
        return;
      }
      const data = (await res.json()) as DealApi;
      setDeal(data.deal);
      setRole(data.participantRole);
    } finally {
      setStatusBusy(false);
    }
  }

  function statusLabel(s: string): string {
    const map: Record<string, string> = {
      proposed: "Proposed",
      changes_requested: "Changes Requested",
      accepted: "Accepted",
      declined: "Declined",
      agreement_pending: "Agreement Pending",
      active: "Active",
      completed: "Completed",
      disputed: "Disputed",
    };
    return map[s] ?? s;
  }

  function statusColor(s: string): string {
    if (s === "active") return "bg-emerald-500/15 text-emerald-300";
    if (s === "completed") return "bg-emerald-500/25 text-emerald-200";
    if (s === "agreement_pending") return "bg-amber-500/15 text-amber-300";
    if (s === "disputed") return "bg-red-500/15 text-red-300";
    if (s === "declined") return "bg-red-500/10 text-red-400";
    return "bg-zinc-500/15 text-zinc-300";
  }

  function bubbleClass(authorRole: string): string {
    if (authorRole === "buyer") {
      return "ml-auto max-w-[min(100%,32rem)] rounded-2xl bg-zinc-800/90 px-4 py-2 text-sm text-zinc-100";
    }
    if (authorRole === "provider") {
      return "mr-auto max-w-[min(100%,32rem)] rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-sm text-sky-100/95";
    }
    if (authorRole === "operator") {
      return "mr-auto max-w-[min(100%,32rem)] rounded-2xl border border-violet-500/25 bg-violet-500/10 px-4 py-2 text-sm text-violet-100/95";
    }
    return "mx-auto max-w-[min(100%,34rem)] rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-2 text-center text-sm text-zinc-400";
  }

  // Determine if we should show the "open agreement" prompt
  const showAgreementPrompt =
    deal &&
    (deal.status === "agreement_pending" || deal.status === "active") &&
    deal.agreement;

  // Check if the deal is active and needs escrow funding (both signed, buyer hasn't funded yet)
  const needsFunding =
    deal?.status === "active" &&
    deal.agreement?.buyerSignedAt &&
    deal.agreement?.providerSignedAt;

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Deal workspace"
          description="Shared buyer-provider chat and milestone proposal acceptance."
        />
        <Link
          href="/marketplace/deals"
          className="mt-4 inline-block text-sm text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200"
        >
          ← All deal chats
        </Link>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        {err && !deal ? <p className="text-sm text-red-400">{err}</p> : null}
        {deal ? (
          <div className="space-y-6">
            {/* ── Proposal header ── */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-100">
                  {deal.providerDisplayName} · {deal.serviceName}
                </h2>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${statusColor(deal.status)}`}
                >
                  {statusLabel(deal.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{deal.proposal.projectTitle}</p>
              <p className="mt-1 text-xs text-zinc-500">{deal.proposal.scopeSummary}</p>
              <p className="mt-2 text-xs text-zinc-600">
                Window: {deal.proposal.startDate} → {deal.proposal.targetDate}
              </p>

              {/* Milestones with escrow status */}
              <ul className="mt-3 space-y-2">
                {deal.proposal.milestones.map((m) => (
                  <li key={m.id} className="rounded-lg border border-white/[0.06] bg-zinc-900/50 p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-200">
                        {m.title} · {m.amountSol.toFixed(2)} SOL
                      </p>
                      {m.escrowStatus && m.escrowStatus !== "pending" ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${ESCROW_COLORS[m.escrowStatus] ?? ""}`}
                        >
                          {ESCROW_LABELS[m.escrowStatus] ?? m.escrowStatus}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{m.deliverable}</p>
                    <p className="mt-1 text-[11px] text-zinc-600">Due {m.dueDate}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-zinc-500">
                Total: {totalSol.toFixed(2)} SOL
              </p>
              {deal.proposal.notes ? (
                <p className="mt-2 text-xs text-zinc-500">Notes: {deal.proposal.notes}</p>
              ) : null}
            </div>

            {/* ── Provider actions (before acceptance) ── */}
            {role === "provider" &&
            deal.status !== "accepted" &&
            deal.status !== "declined" &&
            deal.status !== "agreement_pending" &&
            deal.status !== "active" &&
            deal.status !== "completed" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={statusBusy}
                  onClick={() => void updateStatus("accepted")}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-100 disabled:opacity-40"
                >
                  Accept proposal
                </button>
                <button
                  type="button"
                  disabled={statusBusy}
                  onClick={() => void updateStatus("changes_requested")}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100 disabled:opacity-40"
                >
                  Request changes
                </button>
                <button
                  type="button"
                  disabled={statusBusy}
                  onClick={() => void updateStatus("declined")}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-100 disabled:opacity-40"
                >
                  Decline
                </button>
              </div>
            ) : null}

            {role === "buyer" && deal.status === "proposed" ? (
              <p className="text-xs text-zinc-500">
                Waiting for provider to review your proposal.
              </p>
            ) : null}

            {/* ── Agreement banner (shows when agreement_pending or active) ── */}
            {showAgreementPrompt ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-amber-200">
                      {deal.status === "agreement_pending"
                        ? "Engagement agreement ready for review"
                        : "Agreement signed — engagement active"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {deal.status === "agreement_pending"
                        ? "Both parties must review the terms, fees, and escrow policy, then sign to lock in."
                        : "Both parties signed. Milestone work can begin."}
                    </p>

                    {/* Signature dots */}
                    {deal.agreement ? (
                      <div className="mt-2 flex gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${deal.agreement.buyerSignedAt ? "bg-emerald-500" : "bg-zinc-700"}`}
                          />
                          Buyer {deal.agreement.buyerSignedAt ? "Signed" : "Pending"}
                          {role === "buyer" ? " (you)" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${deal.agreement.providerSignedAt ? "bg-emerald-500" : "bg-zinc-700"}`}
                          />
                          Provider {deal.agreement.providerSignedAt ? "Signed" : "Pending"}
                          {role === "provider" ? " (you)" : ""}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAgreement(true)}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-xs font-medium text-amber-100 hover:bg-amber-500/25"
                  >
                    {deal.status === "agreement_pending"
                      ? "Open Agreement"
                      : "View Agreement"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* ── Payment prompt (buyer, after both signed) ── */}
            {needsFunding && role === "buyer" ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm font-medium text-emerald-200">
                  Fund escrow to begin work
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Total:{" "}
                  {deal.agreement?.feeSnapshot.grandTotalSol.toFixed(4)} SOL
                  (service + fees). On-chain escrow deposit will be available
                  when the program is connected.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-100 opacity-50"
                >
                  Deposit to escrow (coming soon)
                </button>
              </div>
            ) : null}

            {/* ── Escrow milestone tracker (active/completed deals) ── */}
            {(deal.status === "active" || deal.status === "completed" || deal.status === "disputed") &&
            deal.proposal.milestones.some((m) => m.escrowStatus) ? (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Escrow Tracker
                </p>
                <div className="space-y-2">
                  {deal.proposal.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-zinc-900/50 px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-medium text-zinc-200">{m.title}</p>
                        <p className="text-[11px] text-zinc-500">
                          {m.amountSol.toFixed(2)} SOL
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ESCROW_COLORS[m.escrowStatus] ?? "bg-zinc-700 text-zinc-300"}`}
                      >
                        {ESCROW_LABELS[m.escrowStatus] ?? "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ── Chat messages ── */}
            <ul className="flex min-h-[12rem] flex-col gap-3">
              {deal.messages.map((m) => (
                <li
                  key={m.id}
                  className={`flex ${m.authorRole === "buyer" ? "justify-end" : m.authorRole === "system" ? "justify-center" : "justify-start"}`}
                >
                  <div className={bubbleClass(m.authorRole)}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-2 text-[0.65rem] uppercase tracking-wider text-zinc-500">
                      {m.authorRole === "buyer"
                        ? "Buyer"
                        : m.authorRole === "provider"
                          ? "Provider"
                          : m.authorRole === "operator"
                            ? "1ST0P"
                            : "System"}{" "}
                      · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* ── Message input ── */}
            {deal.status !== "declined" && deal.status !== "completed" ? (
              <div className="space-y-2 border-t border-white/[0.06] pt-4">
                <label className="block text-xs text-zinc-500">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.12] bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
                  placeholder="Write to buyer/provider..."
                />
                <button
                  type="button"
                  disabled={sending || !body.trim()}
                  onClick={() => void send()}
                  className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            ) : null}

            {err ? <p className="text-sm text-red-400">{err}</p> : null}
          </div>
        ) : !err ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : null}
      </section>

      {/* ── Agreement modal (popup over chat) ── */}
      {showAgreement && deal && deal.agreement && role ? (
        <AgreementModal
          dealId={dealId}
          milestones={deal.proposal.milestones}
          agreement={deal.agreement}
          participantRole={role}
          projectTitle={deal.proposal.projectTitle}
          scopeSummary={deal.proposal.scopeSummary}
          onClose={() => setShowAgreement(false)}
          onSigned={() => {
            setShowAgreement(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
