"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { shortenWallet } from "@/lib/marketplace-reviews";

type ThreadRow = {
  id: string;
  applicationId: string;
  participantWallet: string;
  status: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
};

export default function InternalMessagesInboxPage() {
  const [secret, setSecret] = useState("");
  const [threads, setThreads] = useState<ThreadRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/internal/messages/threads", {
      credentials: "include",
    });
    if (res.status === 401) {
      setThreads(null);
      return;
    }
    if (!res.ok) {
      setErr("Could not load threads.");
      return;
    }
    const data = (await res.json()) as { threads: ThreadRow[] };
    setThreads(data.threads);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/internal/operator-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        setErr("Invalid operator secret.");
        return;
      }
      setSecret("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/internal/operator-session", {
      method: "DELETE",
      credentials: "include",
    });
    setThreads(null);
  }

  const signedIn = threads !== null;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
            Internal · dev
          </p>
          <h1 className="text-2xl font-semibold">Operator message inbox</h1>
          <p className="text-sm text-zinc-500">
            Not linked from public nav. Use{" "}
            <code className="rounded bg-zinc-900 px-1 text-zinc-400">
              MESSAGES_OPERATOR_SECRET
            </code>{" "}
            in production; in development the default secret is{" "}
            <code className="rounded bg-zinc-900 px-1 text-zinc-400">
              dev-operator
            </code>
            .
          </p>
        </header>

        {!signedIn ? (
          <form
            onSubmit={(e) => void signIn(e)}
            className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-6"
          >
            <label className="block text-sm text-zinc-400">
              Operator secret
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                autoComplete="off"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !secret.trim()}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-xs text-zinc-500 underline"
              >
                Operator sign out
              </button>
            </div>
            {threads.length === 0 ? (
              <p className="text-sm text-zinc-500">No threads yet.</p>
            ) : (
              <ul className="space-y-2">
                {threads.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/internal/messages/${t.id}`}
                      className="block rounded-xl border border-white/10 bg-zinc-900/50 p-4 hover:border-white/20"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs text-zinc-400">
                          {shortenWallet(t.participantWallet, 6)}
                        </span>
                        <span
                          className={
                            t.status === "open"
                              ? "text-xs text-emerald-400"
                              : "text-xs text-zinc-500"
                          }
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-300">
                        {t.preview || "—"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {t.messageCount} msgs · {t.updatedAt}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {err ? <p className="text-sm text-red-400">{err}</p> : null}
      </div>
    </div>
  );
}
