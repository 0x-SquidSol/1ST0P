"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { PageHeader } from "@/components/PageHeader";
import { shortenWallet } from "@/lib/marketplace-reviews";
import {
  loginMessageText,
} from "@/lib/verify-wallet-sign-message";

type ThreadRow = {
  id: string;
  applicationId: string;
  status: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
};

export default function MarketplaceMessagesPage() {
  const { publicKey, signMessage, connected } = useWallet();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [sessionWallet, setSessionWallet] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/messages/threads", { credentials: "include" });
    if (res.status === 401) {
      setThreads(null);
      setSessionWallet(null);
      return;
    }
    if (!res.ok) {
      setErr("Could not load threads.");
      return;
    }
    const data = (await res.json()) as {
      threads: ThreadRow[];
      wallet: string;
    };
    setThreads(data.threads);
    setSessionWallet(data.wallet);
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  async function unlockInbox() {
    setErr(null);
    if (!publicKey || !signMessage) {
      setErr("Connect a wallet that supports sign message (e.g. Phantom).");
      return;
    }
    const wallet = publicKey.toBase58();
    setBusy(true);
    try {
      const nRes = await fetch("/api/messages/nonce");
      if (!nRes.ok) {
        setErr("Could not get sign-in nonce.");
        return;
      }
      const { nonce } = (await nRes.json()) as { nonce: string };
      const message = loginMessageText(wallet, nonce);
      const encoded = new TextEncoder().encode(message);
      const sig = await signMessage(encoded);
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
      await loadThreads();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in cancelled or failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/messages/session", {
      method: "DELETE",
      credentials: "include",
    });
    setThreads(null);
    setSessionWallet(null);
  }

  const signedIn = threads !== null && sessionWallet !== null;

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Messages"
          description="Application updates and reviewer replies (Phase 2 · 6b). Sign in once with the same wallet you used on your provider application. Dev only: data resets when the dev server restarts."
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/marketplace/apply"
            className="text-sm text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200"
          >
            ← Apply as provider
          </Link>
          <Link
            href="/marketplace"
            className="text-sm text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
          >
            Marketplace home
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
                "Connect your wallet (header), then unlock your inbox with a one-time signature."
              )}
            </p>
            <button
              type="button"
              disabled={busy || !connected || !signMessage}
              onClick={() => void unlockInbox()}
              className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
            >
              {busy ? "Signing…" : "Unlock inbox"}
            </button>
            {!signMessage && connected ? (
              <p className="text-xs text-amber-400/90">
                This wallet adapter does not expose sign message. Try Phantom or
                another standard wallet.
              </p>
            ) : null}
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

            {threads.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No threads yet. Submit a provider application to open a thread
                tied to your wallet.
              </p>
            ) : (
              <ul className="space-y-2">
                {threads.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/marketplace/messages/${t.id}`}
                      className="block rounded-xl border border-white/[0.08] bg-zinc-950/40 p-4 transition hover:border-white/15"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-200">
                          Application {shortenWallet(t.applicationId, 4)}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs ${
                            t.status === "open"
                              ? "bg-emerald-500/15 text-emerald-200/90"
                              : "bg-zinc-500/15 text-zinc-400"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                        {t.preview || "—"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {t.messageCount} message{t.messageCount === 1 ? "" : "s"}{" "}
                        · updated {new Date(t.updatedAt).toLocaleString()}
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
