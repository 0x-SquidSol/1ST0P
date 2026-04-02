"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { PageHeader } from "@/components/PageHeader";
import { shortenWallet } from "@/lib/marketplace-reviews";
import { loginMessageText } from "@/lib/verify-wallet-sign-message";

type DealRow = {
  id: string;
  providerDisplayName: string;
  providerSlug: string;
  serviceName: string;
  status: string;
  updatedAt: string;
  preview: string;
  messageCount: number;
  participantRole: "buyer" | "provider";
};

export default function MarketplaceDealsPage() {
  const { publicKey, signMessage, connected } = useWallet();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [deals, setDeals] = useState<DealRow[] | null>(null);
  const [sessionWallet, setSessionWallet] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/marketplace/deals", { credentials: "include" });
    if (res.status === 401) {
      setDeals(null);
      setSessionWallet(null);
      return;
    }
    if (!res.ok) {
      setErr("Could not load deal chats.");
      return;
    }
    const data = (await res.json()) as { deals: DealRow[]; wallet: string };
    setDeals(data.deals);
    setSessionWallet(data.wallet);
  }, []);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  async function unlock() {
    setErr(null);
    if (!publicKey || !signMessage) {
      setErr("Connect a wallet with sign message support.");
      return;
    }
    setBusy(true);
    try {
      const wallet = publicKey.toBase58();
      const nRes = await fetch("/api/messages/nonce");
      if (!nRes.ok) {
        setErr("Could not get sign-in nonce.");
        return;
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
        setErr(j.error ?? "Sign-in failed.");
        return;
      }
      await loadDeals();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/messages/session", {
      method: "DELETE",
      credentials: "include",
    });
    setDeals(null);
    setSessionWallet(null);
  }

  const signedIn = deals !== null && sessionWallet !== null;

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Deal chats"
          description="Buyer-provider conversations for milestone proposals tied to a specific service."
        />
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href="/marketplace"
            className="text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200"
          >
            ← Marketplace home
          </Link>
          <Link
            href="/marketplace/messages"
            className="text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
          >
            Application inbox
          </Link>
        </div>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        {!signedIn ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              {connected && publicKey ? (
                <>
                  Connected:{" "}
                  <span className="font-mono text-zinc-300">
                    {shortenWallet(publicKey.toBase58(), 6)}
                  </span>
                </>
              ) : (
                "Connect your wallet and unlock deal chats."
              )}
            </p>
            <button
              type="button"
              disabled={busy || !connected || !signMessage}
              onClick={() => void unlock()}
              className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
            >
              {busy ? "Signing..." : "Unlock deal chats"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                Signed in as{" "}
                <span className="font-mono text-zinc-300">
                  {shortenWallet(sessionWallet, 6)}
                </span>
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-xs text-zinc-500 underline decoration-white/15"
              >
                Sign out
              </button>
            </div>

            {deals.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No deal chats yet. Open a provider profile and click Hire for a
                specific service.
              </p>
            ) : (
              <ul className="space-y-2">
                {deals.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/marketplace/deals/${d.id}`}
                      className="block rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4 transition hover:border-white/15"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-200">
                          {d.providerDisplayName} · {d.serviceName}
                        </span>
                        <span className="rounded-md bg-zinc-500/15 px-2 py-0.5 text-xs text-zinc-300">
                          {d.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        You are the {d.participantRole}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                        {d.preview || "—"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {d.messageCount} message{d.messageCount === 1 ? "" : "s"} ·{" "}
                        {new Date(d.updatedAt).toLocaleString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}
      </section>
    </div>
  );
}
