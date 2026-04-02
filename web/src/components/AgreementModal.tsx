"use client";

import { useState } from "react";
import type { DealAgreement } from "@/lib/dev-marketplace-store";
import {
  MIN_PLATFORM_FEE_SOL,
  RELEASE_FEE_SOL,
  computeFeeBreakdown,
} from "@/lib/marketplace-fees";

type MilestoneDraft = {
  title: string;
  deliverable: string;
  amountSol: string;
  dueDate: string;
};

type Props = {
  dealId: string;
  agreement: DealAgreement | null;
  dealStatus: string;
  participantRole: "buyer" | "provider";
  onClose: () => void;
  onUpdated: () => void;
};

export function AgreementModal({
  dealId,
  agreement,
  dealStatus,
  participantRole,
  onClose,
  onUpdated,
}: Props) {
  const isEditable = dealStatus === "open" || dealStatus === "drafting";
  const isLocked = dealStatus === "locked";
  const isActive = dealStatus === "active";

  // Draft form state (pre-fill from existing agreement if any)
  const [projectTitle, setProjectTitle] = useState(agreement?.projectTitle ?? "");
  const [scopeSummary, setScopeSummary] = useState(agreement?.scopeSummary ?? "");
  const [startDate, setStartDate] = useState(agreement?.startDate ?? "");
  const [targetDate, setTargetDate] = useState(agreement?.targetDate ?? "");
  const [notes, setNotes] = useState(agreement?.notes ?? "");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(
    agreement?.milestones?.length
      ? agreement.milestones.map((m) => ({
          title: m.title,
          deliverable: m.deliverable,
          amountSol: String(m.amountSol),
          dueDate: m.dueDate,
        }))
      : [{ title: "", deliverable: "", amountSol: "", dueDate: "" }],
  );

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const totalSol = milestones.reduce((acc, m) => {
    const n = Number(m.amountSol);
    return Number.isFinite(n) && n > 0 ? acc + n : acc;
  }, 0);

  const previewFees = computeFeeBreakdown(
    milestones
      .map((m) => Number(m.amountSol))
      .filter((n) => Number.isFinite(n) && n > 0),
  );

  const alreadySigned =
    participantRole === "buyer"
      ? !!agreement?.buyerSignedAt
      : !!agreement?.providerSignedAt;

  const otherSigned =
    participantRole === "buyer"
      ? !!agreement?.providerSignedAt
      : !!agreement?.buyerSignedAt;

  function updateMilestone(idx: number, patch: Partial<MilestoneDraft>) {
    setMilestones((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    );
  }

  function addMilestone() {
    setMilestones((prev) => [
      ...prev,
      { title: "", deliverable: "", amountSol: "", dueDate: "" },
    ]);
  }

  function removeMilestone(idx: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  }

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

  async function saveDraft() {
    await apiCall({
      action: "save_draft",
      draft: {
        projectTitle,
        scopeSummary,
        startDate,
        targetDate,
        notes,
        milestones: milestones.map((m) => ({
          title: m.title,
          deliverable: m.deliverable,
          amountSol: Number(m.amountSol),
          dueDate: m.dueDate,
        })),
      },
    });
  }

  async function lock() {
    // Save first, then lock
    await apiCall({
      action: "save_draft",
      draft: {
        projectTitle,
        scopeSummary,
        startDate,
        targetDate,
        notes,
        milestones: milestones.map((m) => ({
          title: m.title,
          deliverable: m.deliverable,
          amountSol: Number(m.amountSol),
          dueDate: m.dueDate,
        })),
      },
    });
    // If save succeeded, lock
    await apiCall({ action: "lock" });
  }

  async function unlock() {
    await apiCall({ action: "unlock" });
  }

  async function sign() {
    await apiCall({ action: "sign" });
  }

  const fees = isLocked || isActive ? agreement?.feeSnapshot : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.1] bg-zinc-950 p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              {isEditable
                ? "Draft Agreement"
                : isLocked
                  ? "Review & Sign Agreement"
                  : "Agreement"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isEditable
                ? "Fill in the terms. Either party can edit. Lock when ready."
                : isLocked
                  ? "Agreement is locked. Review and sign, or unlock to edit."
                  : "Agreement is active."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Editable form (open / drafting) ── */}
        {isEditable ? (
          <div className="space-y-4">
            <label className="block text-sm text-zinc-400">
              Project title
              <input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                placeholder="Website redesign"
              />
            </label>

            <label className="block text-sm text-zinc-400">
              Scope summary
              <textarea
                value={scopeSummary}
                onChange={(e) => setScopeSummary(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                placeholder="What outcomes and deliverables are expected?"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-zinc-400">
                Start date
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100" />
              </label>
              <label className="block text-sm text-zinc-400">
                Target completion
                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100" />
              </label>
            </div>

            {/* Milestones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-200">Milestones</p>
                <button type="button" onClick={addMilestone}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-900">
                  Add milestone
                </button>
              </div>
              {milestones.map((m, idx) => (
                <div key={`m-${idx}`} className="space-y-2 rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">Milestone {idx + 1}</p>
                    {milestones.length > 1 && (
                      <button type="button" onClick={() => removeMilestone(idx)} className="text-xs text-zinc-500 underline">
                        Remove
                      </button>
                    )}
                  </div>
                  <input value={m.title} onChange={(e) => updateMilestone(idx, { title: e.target.value })}
                    className="w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100" placeholder="Title" />
                  <textarea value={m.deliverable} onChange={(e) => updateMilestone(idx, { deliverable: e.target.value })} rows={2}
                    className="w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100" placeholder="Deliverable details" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input type="number" step="0.01" min="0" value={m.amountSol}
                      onChange={(e) => updateMilestone(idx, { amountSol: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100" placeholder="Amount (SOL)" />
                    <input type="date" value={m.dueDate} onChange={(e) => updateMilestone(idx, { dueDate: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
                  </div>
                </div>
              ))}
            </div>

            <label className="block text-sm text-zinc-400">
              Extra notes (optional)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                placeholder="Constraints, assumptions…" />
            </label>

            {/* Fee preview */}
            {totalSol > 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3 text-xs text-zinc-500">
                <p className="mb-1 font-medium uppercase tracking-wider text-zinc-500">Fee Preview</p>
                <FeeRows fees={previewFees} milestoneCount={milestones.length} />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => void saveDraft()} disabled={busy}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 disabled:opacity-40">
                {busy ? "Saving…" : "Save draft"}
              </button>
              <button onClick={() => void lock()} disabled={busy || totalSol <= 0}
                className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-100 disabled:opacity-40">
                {busy ? "Locking…" : "Lock agreement"}
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Locked / Active view (read-only with sign actions) ── */}
        {(isLocked || isActive) && agreement ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
              <p className="text-sm font-medium text-zinc-200">{agreement.projectTitle}</p>
              <p className="mt-1 text-xs text-zinc-500">{agreement.scopeSummary}</p>
              <p className="mt-2 text-xs text-zinc-600">
                {agreement.startDate} → {agreement.targetDate}
              </p>
              {agreement.notes && (
                <p className="mt-1 text-xs text-zinc-600">Notes: {agreement.notes}</p>
              )}
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Milestones ({agreement.milestones.length})
              </p>
              {agreement.milestones.map((m, idx) => (
                <div key={m.id} className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-200">{idx + 1}. {m.title}</p>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      {m.amountSol.toFixed(2)} SOL
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{m.deliverable}</p>
                  {m.dueDate && <p className="mt-1 text-xs text-zinc-600">Due: {m.dueDate}</p>}
                </div>
              ))}
            </div>

            {/* Fee breakdown */}
            {fees && (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Fees (Locked)</p>
                <FeeRows fees={fees} milestoneCount={agreement.milestones.length} />
              </div>
            )}

            {/* Escrow policy */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3 text-xs text-zinc-500 space-y-1">
              <p className="font-medium uppercase tracking-wider text-zinc-500 mb-1">Escrow Policy</p>
              <p>• Funds held in escrow until both parties confirm each milestone.</p>
              <p>• Milestones released individually as work is delivered.</p>
              <p>• Either party can flag a dispute — frozen until platform review.</p>
              <p>• Platform + release fees non-refundable once active.</p>
            </div>

            {/* Signature status */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Signatures</p>
              <div className="flex gap-4 text-sm">
                <SigBadge label="Buyer" signed={!!agreement.buyerSignedAt} isYou={participantRole === "buyer"} />
                <SigBadge label="Provider" signed={!!agreement.providerSignedAt} isYou={participantRole === "provider"} />
              </div>
            </div>

            {/* Lock info */}
            {isLocked && agreement.lockedBy && (
              <p className="text-xs text-amber-400/80">
                Locked by {agreement.lockedBy === participantRole ? "you" : agreement.lockedBy}.
                {!alreadySigned ? " Review carefully before signing." : ""}
              </p>
            )}

            {/* Actions */}
            {isLocked && (
              <div className="space-y-3 pt-1">
                {!alreadySigned && (
                  <>
                    <label className="flex items-start gap-2 text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-700 bg-zinc-900"
                      />
                      <span>
                        I have reviewed all milestones, fees, and escrow policy. I agree to these terms.
                      </span>
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
                  <p className="text-sm font-medium text-emerald-400">
                    Both parties signed. Agreement is active.
                  </p>
                )}
              </div>
            )}

            {isActive && (
              <p className="text-center text-sm font-medium text-emerald-400">
                Agreement active. Work in progress.
              </p>
            )}
          </div>
        ) : null}

        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      </div>
    </div>
  );
}

function FeeRows({
  fees,
  milestoneCount,
}: {
  fees: { serviceTotalSol: number; platformFeeSol: number; totalReleaseFeeSol: number; estimatedNetworkFeeSol: number; grandTotalSol: number };
  milestoneCount: number;
}) {
  return (
    <div className="space-y-1 text-sm">
      <Row label="Service total" value={`${fees.serviceTotalSol.toFixed(4)} SOL`} />
      <Row label={`Platform fee (≥1% or ${MIN_PLATFORM_FEE_SOL} SOL)`} value={`${fees.platformFeeSol.toFixed(4)} SOL`} />
      <Row label={`Release fees (${milestoneCount} × ${RELEASE_FEE_SOL} SOL)`} value={`${fees.totalReleaseFeeSol.toFixed(4)} SOL`} />
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
