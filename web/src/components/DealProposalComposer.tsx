"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { shortenWallet } from "@/lib/marketplace-reviews";
import { loginMessageText } from "@/lib/verify-wallet-sign-message";

type MilestoneDraft = {
  title: string;
  deliverable: string;
  amountSol: string;
  dueDate: string;
};

export function DealProposalComposer({
  providerSlug,
  providerDisplayName,
  serviceOptions,
  initialServiceName,
}: {
  providerSlug: string;
  providerDisplayName: string;
  serviceOptions: string[];
  initialServiceName: string;
}) {
  const router = useRouter();
  const { publicKey, signMessage, connected } = useWallet();

  const [serviceName, setServiceName] = useState(initialServiceName);
  const [projectTitle, setProjectTitle] = useState("");
  const [scopeSummary, setScopeSummary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { title: "", deliverable: "", amountSol: "", dueDate: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const totalSol = useMemo(
    () =>
      milestones.reduce((acc, m) => {
        const n = Number(m.amountSol);
        return Number.isFinite(n) ? acc + n : acc;
      }, 0),
    [milestones],
  );

  async function ensureSessionWallet(): Promise<boolean> {
    const check = await fetch("/api/messages/threads", { credentials: "include" });
    if (check.ok) return true;
    if (!publicKey || !signMessage) {
      setErr("Connect a wallet with sign message support to start a deal.");
      return false;
    }

    const wallet = publicKey.toBase58();
    const nRes = await fetch("/api/messages/nonce");
    if (!nRes.ok) {
      setErr("Could not get sign-in nonce.");
      return false;
    }
    const { nonce } = (await nRes.json()) as { nonce: string };
    const message = loginMessageText(wallet, nonce);
    const sig = await signMessage(new TextEncoder().encode(message));
    const signature = bs58.encode(sig);
    const sRes = await fetch("/api/messages/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, message, signature }),
    });
    if (!sRes.ok) {
      const j = (await sRes.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Could not sign in with wallet.");
      return false;
    }
    return true;
  }

  function updateMilestone(index: number, patch: Partial<MilestoneDraft>) {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  function addMilestone() {
    setMilestones((prev) => [
      ...prev,
      { title: "", deliverable: "", amountSol: "", dueDate: "" },
    ]);
  }

  function removeMilestone(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitProposal(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const ok = await ensureSessionWallet();
      if (!ok) return;

      const payload = {
        providerSlug,
        serviceName,
        projectTitle,
        scopeSummary,
        startDate,
        targetDate,
        notes: notes.trim() || undefined,
        milestones: milestones.map((m) => ({
          title: m.title,
          deliverable: m.deliverable,
          amountSol: Number(m.amountSol),
          dueDate: m.dueDate,
        })),
      };
      const res = await fetch("/api/marketplace/deals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Could not create proposal.");
        return;
      }
      const data = (await res.json()) as { deal: { id: string } };
      router.push(`/marketplace/deals/${data.deal.id}`);
    } catch (error) {
      setErr(
        error instanceof Error ? error.message : "Could not create proposal.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submitProposal(e)} className="space-y-5">
      <div className="rounded-xl border border-white/[0.1] bg-zinc-950/50 p-4 text-sm text-zinc-400">
        <p>
          Provider: <span className="text-zinc-200">{providerDisplayName}</span>
        </p>
        <p className="mt-1">
          Your wallet:{" "}
          {connected && publicKey ? (
            <span className="font-mono text-zinc-300">
              {shortenWallet(publicKey.toBase58(), 6)}
            </span>
          ) : (
            "connect in header"
          )}
        </p>
      </div>

      <label className="block text-sm text-zinc-400">
        Service
        <select
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        >
          {serviceOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-zinc-400">
        Project title
        <input
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          placeholder="Website redesign + growth sprint"
        />
      </label>

      <label className="block text-sm text-zinc-400">
        Scope summary
        <textarea
          value={scopeSummary}
          onChange={(e) => setScopeSummary(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          placeholder="What outcomes and deliverables are expected?"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="block text-sm text-zinc-400">
          Target completion
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-200">Milestones</p>
          <button
            type="button"
            onClick={addMilestone}
            className="rounded-lg border border-white/20 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
          >
            Add milestone
          </button>
        </div>
        {milestones.map((m, idx) => (
          <div
            key={`m-${idx}`}
            className="space-y-2 rounded-xl border border-white/[0.08] bg-zinc-950/40 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Milestone {idx + 1}
              </p>
              {milestones.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
                  className="text-xs text-zinc-500 underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              value={m.title}
              onChange={(e) => updateMilestone(idx, { title: e.target.value })}
              className="w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              placeholder="Title"
            />
            <textarea
              value={m.deliverable}
              onChange={(e) =>
                updateMilestone(idx, { deliverable: e.target.value })
              }
              rows={2}
              className="w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              placeholder="Deliverable details"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={m.amountSol}
                onChange={(e) => updateMilestone(idx, { amountSol: e.target.value })}
                className="w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                placeholder="Amount (SOL)"
              />
              <input
                type="date"
                value={m.dueDate}
                onChange={(e) => updateMilestone(idx, { dueDate: e.target.value })}
                className="w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
          </div>
        ))}
      </div>

      <label className="block text-sm text-zinc-400">
        Extra notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          placeholder="Constraints, assumptions, acceptance details..."
        />
      </label>

      <div className="rounded-xl border border-white/[0.1] bg-zinc-950/50 p-4 text-xs text-zinc-500">
        <p>
          Proposal preview:{" "}
          <span className="text-zinc-300">{milestones.length} milestones</span> ·{" "}
          <span className="text-zinc-300">{totalSol.toFixed(2)} SOL total</span>
        </p>
        <p className="mt-1">
          Provider can accept, request changes, or decline in the shared deal chat.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
      >
        {busy ? "Creating proposal..." : "Create proposal + open deal chat"}
      </button>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}
    </form>
  );
}
