"use client";

import { useState } from "react";

type Props = {
  dealId: string;
  providerName: string;
  serviceName: string;
  onSubmitted: () => void;
  onClose: () => void;
};

export function ReviewModal({
  dealId,
  providerName,
  serviceName,
  onSubmitted,
  onClose,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const charCount = text.trim().length;
  const canSubmit = rating >= 1 && charCount >= 50;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/marketplace/deals/${dealId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review_and_complete",
          rating,
          reviewText: text.trim(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Could not submit review.");
        return;
      }
      onSubmitted();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Leave a Review
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Required before marking this deal as complete.
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

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-3 mb-4">
          <p className="text-sm text-zinc-300">{providerName}</p>
          <p className="text-xs text-zinc-500">{serviceName}</p>
        </div>

        {/* Star rating */}
        <div className="mb-4">
          <p className="mb-2 text-sm text-zinc-400">Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5"
              >
                <svg
                  className={`h-7 w-7 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "text-amber-400"
                      : "text-zinc-700"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400">
            Written review
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-white/[0.15] bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              placeholder="Describe your experience working with this provider…"
            />
          </label>
          <p className={`mt-1 text-xs ${charCount >= 50 ? "text-zinc-600" : "text-amber-500/80"}`}>
            {charCount}/50 minimum characters
          </p>
        </div>

        <button
          onClick={() => void submit()}
          disabled={!canSubmit || busy}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40 hover:bg-emerald-500"
        >
          {busy ? "Submitting…" : "Submit Review & Mark Complete"}
        </button>

        {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
      </div>
    </div>
  );
}
