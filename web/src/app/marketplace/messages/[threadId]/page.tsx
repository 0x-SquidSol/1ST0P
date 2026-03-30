"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type {
  ApplicationThread,
  ThreadMessage,
} from "@/lib/dev-marketplace-store";
import { PageHeader } from "@/components/PageHeader";

export default function MarketplaceMessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = typeof params.threadId === "string" ? params.threadId : "";

  const [thread, setThread] = useState<ApplicationThread | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!threadId) return;
    setErr(null);
    const res = await fetch(`/api/messages/threads/${threadId}`, {
      credentials: "include",
    });
    if (res.status === 401) {
      router.replace("/marketplace/messages");
      return;
    }
    if (res.status === 404) {
      setErr("Thread not found or not yours.");
      setThread(null);
      return;
    }
    if (!res.ok) {
      setErr("Could not load thread.");
      return;
    }
    const data = (await res.json()) as { thread: ApplicationThread };
    setThread(data.thread);
  }, [threadId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const t = body.trim();
    if (!t || !threadId) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch(`/api/messages/threads/${threadId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: t }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Send failed.");
        return;
      }
      const data = (await res.json()) as { thread: ApplicationThread };
      setThread(data.thread);
      setBody("");
    } finally {
      setSending(false);
    }
  }

  function bubbleStyle(m: ThreadMessage): string {
    if (m.authorRole === "applicant") {
      return "ml-auto max-w-[min(100%,28rem)] rounded-2xl bg-zinc-800/90 px-4 py-2 text-sm text-zinc-100";
    }
    if (m.authorRole === "operator") {
      return "mr-auto max-w-[min(100%,28rem)] rounded-2xl border border-violet-500/25 bg-violet-500/10 px-4 py-2 text-sm text-violet-100/95";
    }
    return "mx-auto max-w-[min(100%,32rem)] rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-2 text-center text-sm text-zinc-400";
  }

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Conversation"
          description="Messages with 1ST0P about your provider application."
        />
        <Link
          href="/marketplace/messages"
          className="mt-4 inline-block text-sm text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200"
        >
          ← All threads
        </Link>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        {err && !thread ? (
          <p className="text-sm text-red-400">{err}</p>
        ) : null}

        {thread ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
              <span>
                Status:{" "}
                <span
                  className={
                    thread.status === "open" ? "text-emerald-400" : "text-zinc-400"
                  }
                >
                  {thread.status}
                </span>
              </span>
              {thread.status === "closed" ? (
                <span className="text-zinc-600">
                  This thread is closed — replies are disabled.
                </span>
              ) : null}
            </div>

            <ul className="flex min-h-[12rem] flex-col gap-3">
              {thread.messages.map((m) => (
                <li key={m.id} className={`flex ${m.authorRole === "applicant" ? "justify-end" : m.authorRole === "operator" ? "justify-start" : "justify-center"}`}>
                  <div className={bubbleStyle(m)}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-2 text-[0.65rem] uppercase tracking-wider text-zinc-500">
                      {m.authorRole === "system"
                        ? "System"
                        : m.authorRole === "operator"
                          ? "1ST0P"
                          : "You"}{" "}
                      · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {thread.status === "open" ? (
              <div className="space-y-2 border-t border-white/[0.06] pt-4">
                <label className="block text-xs text-zinc-500">Your reply</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
                  placeholder="Write a message…"
                />
                <button
                  type="button"
                  disabled={sending || !body.trim()}
                  onClick={() => void send()}
                  className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            ) : null}

            {err && thread ? (
              <p className="text-sm text-red-400">{err}</p>
            ) : null}
          </div>
        ) : !err ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : null}
      </section>
    </div>
  );
}
