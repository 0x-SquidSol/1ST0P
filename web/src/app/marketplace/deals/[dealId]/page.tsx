"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { DealThread } from "@/lib/dev-marketplace-store";
import { PageHeader } from "@/components/PageHeader";
import { AgreementModal } from "@/components/AgreementModal";
import { ReviewModal } from "@/components/ReviewModal";

type DealApi = {
  deal: DealThread;
  participantRole: "buyer" | "provider";
  displayNames?: { buyer: string; provider: string };
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  drafting: "Drafting Contract",
  locked: "Locked — Awaiting Payment",
  active: "Active",
  pending_payment: "Pending Payment",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-zinc-500/15 text-zinc-300",
  drafting: "bg-amber-500/15 text-amber-300",
  locked: "bg-amber-500/25 text-amber-200",
  active: "bg-emerald-500/15 text-emerald-300",
  pending_payment: "bg-amber-500/20 text-amber-200",
  completed: "bg-emerald-500/25 text-emerald-200",
  disputed: "bg-red-500/15 text-red-300",
  cancelled: "bg-zinc-500/15 text-zinc-500",
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
  const [showAgreement, setShowAgreement] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [names, setNames] = useState<{ buyer: string; provider: string } | null>(null);

  const load = useCallback(async () => {
    if (!dealId) return;
    setErr(null);
    const res = await fetch(`/api/marketplace/deals/${dealId}`, { credentials: "include" });
    if (res.status === 401) { router.replace("/marketplace/deals"); return; }
    if (res.status === 404) { setErr("Deal not found."); setDeal(null); return; }
    if (!res.ok) { setErr("Could not load deal."); return; }
    const data = (await res.json()) as DealApi;
    setDeal(data.deal);
    setRole(data.participantRole);
    if (data.displayNames) setNames(data.displayNames);
  }, [dealId, router]);

  useEffect(() => { void load(); }, [load]);

  async function send() {
    const t = body.trim();
    if (!t || !dealId) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch(`/api/marketplace/deals/${dealId}/messages`, {
        method: "POST", credentials: "include",
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
    } finally { setSending(false); }
  }

  function bubbleClass(authorRole: string): string {
    if (authorRole === "buyer")
      return "ml-auto max-w-[min(100%,32rem)] rounded-2xl bg-zinc-800/90 px-4 py-2 text-sm text-zinc-100";
    if (authorRole === "provider")
      return "mr-auto max-w-[min(100%,32rem)] rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-sm text-sky-100/95";
    if (authorRole === "operator")
      return "mr-auto max-w-[min(100%,32rem)] rounded-2xl border border-violet-500/25 bg-violet-500/10 px-4 py-2 text-sm text-violet-100/95";
    return "mx-auto max-w-[min(100%,34rem)] rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-2 text-center text-sm text-zinc-400";
  }

  const [completeBusy, setCompleteBusy] = useState(false);

  const canChat = deal && deal.status !== "cancelled" && deal.status !== "completed";
  const showBanner = deal && deal.status !== "cancelled";

  const needsFunding =
    deal?.status === "active" &&
    deal.agreement?.buyerSignedAt &&
    deal.agreement?.providerSignedAt &&
    role === "buyer";

  const myCompleted =
    role === "buyer" ? !!deal?.buyerCompletedAt : !!deal?.providerCompletedAt;
  const otherCompleted =
    role === "buyer" ? !!deal?.providerCompletedAt : !!deal?.buyerCompletedAt;
  const showCompletionPanel = deal?.status === "active" || deal?.status === "pending_payment";

  async function markComplete() {
    if (!dealId) return;
    setCompleteBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/marketplace/deals/${dealId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_complete" }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Could not mark complete.");
        return;
      }
      void load();
    } finally {
      setCompleteBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader label="Marketplace" title="Deal workspace"
          description="Chat with your counterpart. Draft, lock, and sign the contract when ready." />
        <Link href="/marketplace/deals"
          className="mt-4 inline-block text-sm text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200">
          ← All deal chats
        </Link>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        {err && !deal ? <p className="text-sm text-red-400">{err}</p> : null}
        {deal ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-100">
                  {deal.providerDisplayName} · {deal.serviceName}
                </h2>
                <span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_COLORS[deal.status] ?? ""}`}>
                  {STATUS_LABELS[deal.status] ?? deal.status}
                </span>
              </div>
            </div>

            {/* Contract banner */}
            {showBanner ? (
              <div className={`rounded-xl border p-4 ${
                deal.status === "active" || deal.status === "completed"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : deal.status === "locked"
                    ? "border-amber-500/25 bg-amber-500/5"
                    : "border-white/[0.08] bg-zinc-900/30"
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`text-sm font-medium ${
                      deal.status === "active" || deal.status === "completed" ? "text-emerald-200"
                        : deal.status === "locked" ? "text-amber-200" : "text-zinc-300"
                    }`}>
                      {deal.status === "open" && "No contract drafted yet"}
                      {deal.status === "drafting" && "Contract being drafted"}
                      {deal.status === "locked" && "Contract locked — review and sign"}
                      {deal.status === "active" && "Contract signed — work in progress"}
                      {deal.status === "completed" && "Engagement complete"}
                      {deal.status === "disputed" && "Dispute in progress"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {deal.status === "open" && "Discuss terms in chat, then open the contract to draft details."}
                      {deal.status === "drafting" && "Either party can edit. Lock when you're both happy with the terms."}
                      {deal.status === "locked" && "Both locked. Buyer can now pay to activate."}
                      {deal.status === "active" && "Payment held in escrow until both confirm completion."}
                    </p>

                    {deal.agreement && (deal.status === "drafting" || deal.status === "locked" || deal.status === "active") && (
                      <div className="mt-2 flex gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <span className={`inline-block h-2 w-2 rounded-full ${deal.agreement.buyerLockedAt ? "bg-amber-500" : "bg-zinc-700"}`} />
                          Buyer {deal.agreement.buyerLockedAt ? "Locked" : "Pending"}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className={`inline-block h-2 w-2 rounded-full ${deal.agreement.providerLockedAt ? "bg-amber-500" : "bg-zinc-700"}`} />
                          Provider {deal.agreement.providerLockedAt ? "Locked" : "Pending"}
                        </span>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowAgreement(true)}
                    className={`rounded-lg border px-4 py-2 text-xs font-medium ${
                      deal.status === "open" ? "border-white/20 text-zinc-300 hover:bg-zinc-900"
                        : deal.status === "locked" ? "border-amber-500/30 bg-amber-500/15 text-amber-100"
                        : deal.status === "active" || deal.status === "completed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : "border-white/20 text-zinc-300 hover:bg-zinc-900"
                    }`}>
                    {deal.status === "open" ? "Draft Contract"
                      : deal.status === "drafting" ? "Edit Contract"
                      : deal.status === "locked" ? "Review & Sign"
                      : "View Contract"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Payment prompt */}
            {needsFunding && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm font-medium text-emerald-200">Fund escrow to begin work</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Total: {deal.agreement?.feeSnapshot?.grandTotalSol.toFixed(4)} SOL (service + fees).
                  On-chain escrow deposit available when the program is connected.
                </p>
                <button type="button" disabled
                  className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-100 opacity-50">
                  Deposit to escrow (coming soon)
                </button>
              </div>
            )}

            {/* Contract summary (when active/completed/pending_payment) */}
            {(deal.status === "active" || deal.status === "pending_payment" || deal.status === "completed") && deal.agreement ? (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Contract Summary</p>
                <p className="text-sm text-zinc-300"><span className="text-zinc-500">Service:</span> {deal.agreement.serviceType}</p>
                <p className="text-sm text-zinc-300"><span className="text-zinc-500">Cost:</span> {deal.agreement.totalCostSol.toFixed(2)} SOL (in escrow)</p>
              </div>
            ) : null}

            {/* Completion check-off panel */}
            {showCompletionPanel && (
              <div className={`rounded-xl border p-4 ${
                deal.status === "pending_payment"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-white/[0.08] bg-zinc-950/45"
              }`}>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {deal.status === "pending_payment" ? "Awaiting Admin Payout" : "Completion Check-off"}
                </p>

                <div className="flex gap-4 text-sm mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${deal.buyerCompletedAt ? "bg-emerald-500" : "bg-zinc-700"}`} />
                    <span className="text-zinc-300">Buyer</span>
                    <span className="text-xs text-zinc-600">{deal.buyerCompletedAt ? "Confirmed" : "Pending"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${deal.providerCompletedAt ? "bg-emerald-500" : "bg-zinc-700"}`} />
                    <span className="text-zinc-300">Provider</span>
                    <span className="text-xs text-zinc-600">{deal.providerCompletedAt ? "Confirmed" : "Pending"}</span>
                  </span>
                </div>

                {deal.status === "active" && !myCompleted && role === "buyer" && (
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500"
                  >
                    Review & Complete
                  </button>
                )}

                {deal.status === "active" && !myCompleted && role === "provider" && (
                  <button
                    type="button"
                    onClick={() => void markComplete()}
                    disabled={completeBusy}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40 hover:bg-emerald-500"
                  >
                    {completeBusy ? "Confirming…" : "Mark as Complete"}
                  </button>
                )}

                {deal.status === "active" && myCompleted && !otherCompleted && (
                  <p className="text-sm text-zinc-400">
                    You confirmed completion. Waiting for the other party.
                  </p>
                )}

                {deal.status === "pending_payment" && (
                  <p className="text-sm text-emerald-300">
                    Both parties confirmed. Admin will review and release payment.
                  </p>
                )}

                {deal.status === "completed" && deal.payoutReleasedAt && (
                  <p className="text-sm text-emerald-300">
                    Payment released. Engagement complete.
                  </p>
                )}
              </div>
            )}

            {/* Chat messages */}
            <ul className="flex min-h-[12rem] flex-col gap-3">
              {deal.messages.map((m) => (
                <li key={m.id}
                  className={`flex ${m.authorRole === "buyer" ? "justify-end" : m.authorRole === "system" ? "justify-center" : "justify-start"}`}>
                  <div className={bubbleClass(m.authorRole)}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-2 text-[0.65rem] uppercase tracking-wider text-zinc-500">
                      {m.authorRole === "buyer" ? (names?.buyer ?? "Buyer")
                        : m.authorRole === "provider" ? (names?.provider ?? "Provider")
                        : m.authorRole === "operator" ? "1ST0P" : "System"}{" "}
                      · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Message input */}
            {canChat && (
              <div className="space-y-2 border-t border-white/[0.06] pt-4">
                <label className="block text-xs text-zinc-500">Message</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-white/[0.12] bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
                  placeholder="Write to buyer/provider…" />
                <button type="button" disabled={sending || !body.trim()} onClick={() => void send()}
                  className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40">
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            )}

            {err && <p className="text-sm text-red-400">{err}</p>}
          </div>
        ) : !err ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : null}
      </section>

      {/* Contract modal */}
      {showAgreement && deal && role ? (
        <AgreementModal
          dealId={dealId}
          agreement={deal.agreement}
          dealStatus={deal.status}
          participantRole={role}
          serviceName={deal.serviceName}
          onClose={() => setShowAgreement(false)}
          onUpdated={() => {
            setShowAgreement(false);
            void load();
          }}
        />
      ) : null}

      {/* Review modal (buyer only) */}
      {showReview && deal && role === "buyer" ? (
        <ReviewModal
          dealId={dealId}
          providerName={deal.providerDisplayName}
          serviceName={deal.agreement?.serviceType ?? deal.serviceName}
          onClose={() => setShowReview(false)}
          onSubmitted={() => {
            setShowReview(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
