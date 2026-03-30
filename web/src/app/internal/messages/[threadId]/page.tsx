"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type {
  ApplicationThread,
  ThreadMessage,
} from "@/lib/dev-marketplace-store";

export default function InternalMessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = typeof params.threadId === "string" ? params.threadId : "";

  const [thread, setThread] = useState<ApplicationThread | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    if (!threadId) return;
    setErr(null);
    const res = await fetch(`/api/internal/messages/threads/${threadId}`, {
      credentials: "include",
    });
    if (res.status === 401) {
      router.replace("/internal/messages");
      return;
    }
    if (res.status === 404) {
      setErr("Thread not found.");
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
      const res = await fetch(`/api/internal/messages/threads/${threadId}`, {
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

  async function setStatus(status: "open" | "closed") {
    if (!threadId) return;
    setClosing(true);
    setErr(null);
    try {
      const res = await fetch(`/api/internal/messages/threads/${threadId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Update failed.");
        return;
      }
      const data = (await res.json()) as { thread: ApplicationThread };
      setThread(data.thread);
    } finally {
      setClosing(false);
    }
  }

  function bubbleStyle(m: ThreadMessage): string {
    if (m.authorRole === "operator") {
      return "ml-auto max-w-[min(100%,28rem)] rounded-2xl bg-violet-500/20 px-4 py-2 text-sm text-violet-50";
    }
    if (m.authorRole === "applicant") {
      return "mr-auto max-w-[min(100%,28rem)] rounded-2xl bg-zinc-800/90 px-4 py-2 text-sm text-zinc-100";
    }
    return "mx-auto max-w-[min(100%,32rem)] rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-2 text-center text-sm text-zinc-400";
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/internal/messages"
          className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-300"
        >
          ← Inbox
        </Link>

        {err && !thread ? (
          <p className="text-sm text-red-400">{err}</p>
        ) : null}

        {thread ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl font-semibold">Thread</h1>
              <div className="flex flex-wrap gap-2">
                {thread.status === "open" ? (
                  <button
                    type="button"
                    disabled={closing}
                    onClick={() => void setStatus("closed")}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
                  >
                    Close thread
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={closing}
                    onClick={() => void setStatus("open")}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
                  >
                    Reopen thread
                  </button>
                )}
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {thread.messages.map((m) => (
                <li
                  key={m.id}
                  className={`flex ${
                    m.authorRole === "operator"
                      ? "justify-end"
                      : m.authorRole === "applicant"
                        ? "justify-start"
                        : "justify-center"
                  }`}
                >
                  <div className={bubbleStyle(m)}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-2 text-[0.65rem] uppercase tracking-wider text-zinc-500">
                      {m.authorRole} · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {thread.status === "open" ? (
              <div className="space-y-2 border-t border-white/10 pt-4">
                <label className="block text-xs text-zinc-500">
                  Operator reply
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={sending || !body.trim()}
                  onClick={() => void send()}
                  className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
                >
                  {sending ? "Sending…" : "Send as 1ST0P"}
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">
                Thread is closed. Reopen to post as operator.
              </p>
            )}

            {err && thread ? (
              <p className="text-sm text-red-400">{err}</p>
            ) : null}
          </>
        ) : !err ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : null}
      </div>
    </div>
  );
}
