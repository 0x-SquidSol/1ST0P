"use client";

import { useState } from "react";
import type { DealAgreement, DealMilestone } from "@/lib/dev-marketplace-store";
import {
  MIN_PLATFORM_FEE_SOL,
  RELEASE_FEE_SOL,
} from "@/lib/marketplace-fees";

type Props = {
  dealId: string;
  milestones: DealMilestone[];
  agreement: DealAgreement;
  participantRole: "buyer" | "provider";
  projectTitle: string;
  scopeSummary: string;
  onClose: () => void;
  onSigned: () => void;
};

export function AgreementModal({
  dealId,
  milestones,
  agreement,
  participantRole,
  projectTitle,
  scopeSummary,
  onClose,
  onSigned,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const fees = agreement.feeSnapshot;
  const alreadySigned =
    participantRole === "buyer"
      ? !!agreement.buyerSignedAt
      : !!agreement.providerSignedAt;

  const otherSigned =
    participantRole === "buyer"
      ? !!agreement.providerSignedAt
      : !!agreement.buyerSignedAt;

  async function handleSign() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/marketplace/deals/${dealId}/agree`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign" }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Could not sign agreement.");
        return;
      }
      onSigned();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.1] bg-zinc-950 p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Engagement Agreement
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Review all terms, then sign to lock in.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Project summary */}
        <div className="mb-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
          <p className="text-sm font-medium text-zinc-200">{projectTitle}</p>
          <p className="mt-1 text-xs text-zinc-500 line-clamp-3">
            {scopeSummary}
          </p>
        </div>

        {/* Milestones */}
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Milestones ({milestones.length})
          </p>
          {milestones.map((m, idx) => (
            <div
              key={m.id}
              className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-200">
                  {idx + 1}. {m.title}
                </p>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  {m.amountSol.toFixed(2)} SOL
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{m.deliverable}</p>
              {m.dueDate && (
                <p className="mt-1 text-xs text-zinc-600">Due: {m.dueDate}</p>
              )}
            </div>
          ))}
        </div>

        {/* Fee breakdown */}
        <div className="mb-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Fee Breakdown
          </p>
          <div className="space-y-1 text-sm">
            <Row label="Service total" value={`${fees.serviceTotalSol.toFixed(4)} SOL`} />
            <Row
              label={`Platform fee (≥1% or ${MIN_PLATFORM_FEE_SOL} SOL)`}
              value={`${fees.platformFeeSol.toFixed(4)} SOL`}
            />
            <Row
              label={`Release fees (${milestones.length} × ${RELEASE_FEE_SOL} SOL)`}
              value={`${fees.totalReleaseFeeSol.toFixed(4)} SOL`}
            />
            <Row
              label="Est. network fees"
              value={`~${fees.estimatedNetworkFeeSol.toFixed(6)} SOL`}
              muted
            />
            <div className="mt-2 border-t border-white/[0.08] pt-2">
              <Row
                label="Grand total"
                value={`${fees.grandTotalSol.toFixed(4)} SOL`}
                bold
              />
            </div>
          </div>
        </div>

        {/* Escrow policy */}
        <div className="mb-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3 text-xs text-zinc-500 space-y-1">
          <p className="font-medium uppercase tracking-wider text-zinc-500 mb-1">
            Escrow Policy
          </p>
          <p>
            • Funds are held in escrow until both parties confirm each milestone
            is complete.
          </p>
          <p>
            • Milestones can be released individually as work is delivered.
          </p>
          <p>
            • Either party can flag a dispute. Disputed milestones are frozen
            until resolved by platform review.
          </p>
          <p>
            • Platform fee and release fees are non-refundable once the
            engagement is active.
          </p>
        </div>

        {/* Signature status */}
        <div className="mb-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Signatures
          </p>
          <div className="flex gap-4 text-sm">
            <SigBadge
              label="Provider"
              signed={!!agreement.providerSignedAt}
              isYou={participantRole === "provider"}
            />
            <SigBadge
              label="Buyer"
              signed={!!agreement.buyerSignedAt}
              isYou={participantRole === "buyer"}
            />
          </div>
        </div>

        {/* Acknowledge + sign */}
        {!alreadySigned && (
          <>
            <label className="mb-3 flex items-start gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-900"
              />
              <span>
                I have reviewed the milestones, fees, and escrow policy above. I
                agree to the terms of this engagement.
              </span>
            </label>

            <button
              onClick={() => void handleSign()}
              disabled={!accepted || busy}
              className="w-full rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
            >
              {busy
                ? "Signing..."
                : `Sign as ${participantRole === "buyer" ? "Buyer" : "Provider"}`}
            </button>
          </>
        )}

        {alreadySigned && !otherSigned && (
          <p className="text-center text-sm text-zinc-500">
            You signed. Waiting for the other party to sign.
          </p>
        )}

        {alreadySigned && otherSigned && (
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-400">
              Both parties signed. Agreement is active.
            </p>
            {participantRole === "buyer" && (
              <p className="mt-1 text-xs text-zinc-500">
                You will be prompted to fund escrow.
              </p>
            )}
          </div>
        )}

        {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-zinc-600" : "text-zinc-400"}>{label}</span>
      <span
        className={
          bold
            ? "font-medium text-zinc-100"
            : muted
              ? "text-zinc-600"
              : "text-zinc-300"
        }
      >
        {value}
      </span>
    </div>
  );
}

function SigBadge({
  label,
  signed,
  isYou,
}: {
  label: string;
  signed: boolean;
  isYou: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-2.5 w-2.5 rounded-full ${signed ? "bg-emerald-500" : "bg-zinc-700"}`}
      />
      <span className="text-zinc-300">
        {label}
        {isYou ? " (you)" : ""}
      </span>
      <span className="text-xs text-zinc-600">
        {signed ? "Signed" : "Pending"}
      </span>
    </div>
  );
}
