"use client";

import { useState } from "react";
import type { DealAgreement } from "@/lib/dev-marketplace-store";
import {
  MIN_PLATFORM_FEE_SOL,
  RELEASE_FEE_SOL,
  computeFeeBreakdown,
} from "@/lib/marketplace-fees";

type Props = {
  dealId: string;
  agreement: DealAgreement | null;
  dealStatus: string;
  participantRole: "buyer" | "provider";
  /** Locked service name from the deal thread. */
  serviceName: string;
  onClose: () => void;
  onUpdated: () => void;
};

export function AgreementModal({
  dealId,
  agreement,
  dealStatus,
  participantRole,
  serviceName,
  onClose,
  onUpdated,
}: Props) {
  const isEditable = dealStatus === "open" || dealStatus === "drafting";
  const isLocked = dealStatus === "locked";
  const isActive = dealStatus === "active";

  // Form state
  const [scopeDetails, setScopeDetails] = useState(agreement?.scopeDetails ?? "");
  const [timeline, setTimeline] = useState(agreement?.timeline ?? "");
  const [totalCostSol, setTotalCostSol] = useState(
    agreement?.totalCostSol ? String(agreement.totalCostSol) : "",
  );

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const costNum = Number(totalCostSol);
  const validCost = Number.isFinite(costNum) && costNum > 0;
  const previewFees = validCost ? computeFeeBreakdown([costNum]) : null;

  const alreadySigned =
    participantRole === "buyer"
      ? !!agreement?.buyerSignedAt
      : !!agreement?.providerSignedAt;
  const otherSigned =
    participantRole === "buyer"
      ? !!agreement?.providerSignedAt
      : !!agreement?.buyerSignedAt;

  async function apiCall(body: object) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/marketplace/deals/${dealId}/agree`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Action failed.");
        return;
      }
      onUpdated();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  function buildDraft() {
    return {
      serviceType: serviceName,
      scopeDetails,
      timeline,
      totalCostSol: Number(totalCostSol),
    };
  }

  async function saveDraft() {
    await apiCall({ action: "save_draft", draft: buildDraft() });
  }

  async function lockContract() {
    // Save first, then lock
    const draft = buildDraft();
    const saveRes = await fetch(`/api/marketplace/deals/${dealId}/agree`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_draft", draft }),
    });
    if (!saveRes.ok) {
      const j = (await saveRes.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Could not save draft.");
      return;
    }
    await apiCall({ action: "lock" });
  }

  async function unlock() {
    await apiCall({ action: "unlock" });
  }

  async function sign() {
    await apiCall({ action: "sign" });
  }

  const fees = (isLocked || isActive) ? agreement?.feeSnapshot : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.1] bg-zinc-950 p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              {isEditable ? "Draft Contract" : isLocked ? "Review & Sign Contract" : "Contract"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isEditable
                ? "Fill in the details. Either party can edit. Lock when ready."
                : isLocked
                  ? "Contract is locked. Review and sign, or unlock to edit."
                  : "Contract is active."}
            </p>
          </div>
          <button onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Editable form ── */}
        {isEditable ? (
          <div className="space-y-4">
            {/* Service Type — locked, not editable */}
            <div>
              <label className="block text-sm text-zinc-400">Service Type</label>
              <div className="mt-1 rounded-lg border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300">
                {serviceName}
              </div>
              <p className="mt-1 text-[11px] text-zinc-600">Locked to the service you selected when hiring.</p>
            </div>

            {/* Scope */}
            <label className="block text-sm text-zinc-400">
              Scope & Terms
              <textarea
                value={scopeDetails}
                onChange={(e) => setScopeDetails(e.target.value)}
                rows={8}
                className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                placeholder="Add as much detail as possible, these are the terms of your contract! Keep it simple but detailed."
              />
            </label>

            {/* Timeline */}
            <label className="block text-sm text-zinc-400">
              Contract Timeline
              <textarea
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                placeholder="Explain when the service will end or is expected to finish."
              />
            </label>

            {/* Total cost */}
            <label className="block text-sm text-zinc-400">
              Total cost in SOL
              <span className="ml-1 text-xs text-zinc-600">(charged now, held in escrow, paid upon completion)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalCostSol}
                onChange={(e) => setTotalCostSol(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                placeholder="0.00"
              />
            </label>

            {/* Fee preview */}
            {previewFees && (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3 text-xs text-zinc-500">
                <p className="mb-1 font-medium uppercase tracking-wider text-zinc-500">Fee Preview</p>
                <FeeRows fees={previewFees} />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => void saveDraft()} disabled={busy}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40">
                {busy ? "Saving…" : "Save draft"}
              </button>
              <button onClick={() => void lockContract()} disabled={busy || !validCost || !scopeDetails.trim() || !timeline.trim()}
                className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-100 disabled:opacity-40">
                {busy ? "Locking…" : "Lock contract"}
              </button>
            </div>

            {/* Fine print */}
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Admins monitor the chat and contract creation. Tag @admin if you have any disputes to ping.
            </p>
          </div>
        ) : null}

        {/* ── Locked / Active view (read-only) ── */}
        {(isLocked || isActive) && agreement ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">Service Type</p>
              <p className="text-sm text-zinc-200">{agreement.serviceType}</p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">Scope & Terms</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{agreement.scopeDetails}</p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">Contract Timeline</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{agreement.timeline}</p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">Total Cost</p>
              <p className="text-lg font-semibold text-zinc-100">{agreement.totalCostSol.toFixed(2)} SOL</p>
              <p className="text-xs text-zinc-600">Charged now · Held in escrow · Paid upon completion</p>
            </div>

            {/* Fee breakdown */}
            {fees && (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Fees (Locked)</p>
                <FeeRows fees={fees} />
              </div>
            )}

            {/* Escrow policy */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3 text-xs text-zinc-500 space-y-1">
              <p className="font-medium uppercase tracking-wider text-zinc-500 mb-1">Escrow Policy</p>
              <p>• Full payment held in escrow until both parties confirm completion.</p>
              <p>• Either party can flag a dispute — funds frozen until platform review.</p>
              <p>• Platform + release fees non-refundable once active.</p>
            </div>

            {/* Signatures */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Signatures</p>
              <div className="flex gap-4 text-sm">
                <SigBadge label="Buyer" signed={!!agreement.buyerSignedAt} isYou={participantRole === "buyer"} />
                <SigBadge label="Provider" signed={!!agreement.providerSignedAt} isYou={participantRole === "provider"} />
              </div>
            </div>

            {isLocked && agreement.lockedBy && (
              <p className="text-xs text-amber-400/80">
                Locked by {agreement.lockedBy === participantRole ? "you" : agreement.lockedBy}.
                {!alreadySigned ? " Review carefully before signing." : ""}
              </p>
            )}

            {/* Sign / unlock actions */}
            {isLocked && (
              <div className="space-y-3 pt-1">
                {!alreadySigned && (
                  <>
                    <label className="flex items-start gap-2 text-xs text-zinc-400">
                      <input type="checkbox" checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-700 bg-zinc-900" />
                      <span>I have reviewed the scope, timeline, cost, fees, and escrow policy. I agree to these terms.</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => void sign()} disabled={!acceptedTerms || busy}
                        className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40">
                        {busy ? "Signing…" : `Sign as ${participantRole === "buyer" ? "Buyer" : "Provider"}`}
                      </button>
                      <button onClick={() => void unlock()} disabled={busy}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900 disabled:opacity-40">
                        Unlock for edits
                      </button>
                    </div>
                  </>
                )}
                {alreadySigned && !otherSigned && (
                  <p className="text-sm text-zinc-500">You signed. Waiting for the other party.</p>
                )}
                {alreadySigned && otherSigned && (
                  <p className="text-sm font-medium text-emerald-400">Both parties signed. Contract is active.</p>
                )}
              </div>
            )}

            {isActive && (
              <p className="text-center text-sm font-medium text-emerald-400">Contract active. Work in progress.</p>
            )}

            {/* Fine print */}
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Admins monitor the chat and contract creation. Tag @admin if you have any disputes to ping.
            </p>
          </div>
        ) : null}

        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      </div>
    </div>
  );
}

function FeeRows({ fees }: {
  fees: { serviceTotalSol: number; platformFeeSol: number; totalReleaseFeeSol: number; estimatedNetworkFeeSol: number; grandTotalSol: number };
}) {
  return (
    <div className="space-y-1 text-sm">
      <Row label="Service total" value={`${fees.serviceTotalSol.toFixed(4)} SOL`} />
      <Row label={`Platform fee (≥1% or ${MIN_PLATFORM_FEE_SOL} SOL)`} value={`${fees.platformFeeSol.toFixed(4)} SOL`} />
      <Row label={`Release fee (${RELEASE_FEE_SOL} SOL)`} value={`${fees.totalReleaseFeeSol.toFixed(4)} SOL`} />
      <Row label="Est. network fees" value={`~${fees.estimatedNetworkFeeSol.toFixed(6)} SOL`} muted />
      <div className="mt-2 border-t border-white/[0.08] pt-2">
        <Row label="Grand total" value={`${fees.grandTotalSol.toFixed(4)} SOL`} bold />
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-zinc-600" : "text-zinc-400"}>{label}</span>
      <span className={bold ? "font-medium text-zinc-100" : muted ? "text-zinc-600" : "text-zinc-300"}>{value}</span>
    </div>
  );
}

function SigBadge({ label, signed, isYou }: { label: string; signed: boolean; isYou: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2.5 w-2.5 rounded-full ${signed ? "bg-emerald-500" : "bg-zinc-700"}`} />
      <span className="text-zinc-300">{label}{isYou ? " (you)" : ""}</span>
      <span className="text-xs text-zinc-600">{signed ? "Signed" : "Pending"}</span>
    </div>
  );
}
