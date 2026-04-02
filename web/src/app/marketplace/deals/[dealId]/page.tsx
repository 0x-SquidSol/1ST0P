"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DealThread } from "@/lib/dev-marketplace-store";
import { PageHeader } from "@/components/PageHeader";

type DealApi = {
  deal: DealThread;
  participantRole: "buyer" | "provider";
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
            <div className="rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-100">
                  {deal.providerDisplayName} · {deal.serviceName}
                </h2>
                <span className="rounded-md bg-zinc-500/15 px-2 py-0.5 text-xs text-zinc-300">
                  {deal.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{deal.proposal.projectTitle}</p>
              <p className="mt-1 text-xs text-zinc-500">{deal.proposal.scopeSummary}</p>
              <p className="mt-2 text-xs text-zinc-600">
                Window: {deal.proposal.startDate} → {deal.proposal.targetDate}
              </p>
              <ul className="mt-3 space-y-2">
                {deal.proposal.milestones.map((m) => (
                  <li key={m.id} className="rounded-lg border border-white/[0.06] bg-zinc-900/50 p-2">
                    <p className="text-xs font-medium text-zinc-200">
                      {m.title} · {m.amountSol.toFixed(2)} SOL
                    </p>
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

            {role === "provider" && deal.status !== "accepted" && deal.status !== "declined" ? (
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

            {role === "buyer" && deal.status !== "accepted" ? (
              <p className="text-xs text-zinc-500">
                Waiting for provider decision before escrow/payment steps.
              </p>
            ) : null}

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

            {err ? <p className="text-sm text-red-400">{err}</p> : null}
          </div>
        ) : !err ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : null}
      </section>
    </div>
  );
}
