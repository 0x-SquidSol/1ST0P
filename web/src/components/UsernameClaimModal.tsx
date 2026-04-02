"use client";

import { useState } from "react";

type Props = {
  onClaimed: (username: string) => void;
  onClose?: () => void;
  /** If true, the user cannot dismiss without claiming. */
  required?: boolean;
};

export function UsernameClaimModal({ onClaimed, onClose, required }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(value.trim());

  async function claim() {
    if (!valid) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/profile/username", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value.trim() }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Could not claim username.");
        return;
      }
      const data = (await res.json()) as { profile: { username: string } };
      onClaimed(data.profile.username);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-zinc-950 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-zinc-100">Choose your username</h2>
        <p className="mt-1 text-xs text-zinc-500">
          This is permanent and tied to your wallet. It cannot be changed later.
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            maxLength={20}
            className="w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            placeholder="your_username"
            autoFocus
          />
          <p className="text-[11px] text-zinc-600">
            3-20 characters. Letters, numbers, underscores only.
          </p>

          <button
            onClick={() => void claim()}
            disabled={!valid || busy}
            className="w-full rounded-lg bg-zinc-100 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
          >
            {busy ? "Claiming…" : "Claim username"}
          </button>

          {!required && onClose && (
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-white/10 py-2 text-sm text-zinc-500 hover:bg-zinc-900"
            >
              Skip for now
            </button>
          )}

          {err && <p className="text-sm text-red-400">{err}</p>}
        </div>
      </div>
    </div>
  );
}
