"use client";

import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ReputationStarRow } from "@/components/ReputationStarRow";
import {
  appendUserReview,
  canonicalReviewPayload,
  formatReputationLine,
  MARKETPLACE_REVIEWS_STORAGE_KEY,
  MARKETPLACE_REVIEWS_UPDATED_EVENT,
  mergedReviewsForProvider,
  type MarketplaceReview,
  reputationFromReviewList,
  shortenWallet,
} from "@/lib/marketplace-reviews";

type Props = {
  providerSlug: string;
  serviceNames: string[];
  fallbackRating?: number;
  fallbackReviewCount?: number;
};

export function ProviderReputationPanel({
  providerSlug,
  serviceNames,
  fallbackRating,
  fallbackReviewCount,
}: Props) {
  const wallet = useWallet();
  const [version, setVersion] = useState(0);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [serviceName, setServiceName] = useState(
    () => serviceNames[0] ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (serviceName && !serviceNames.includes(serviceName)) {
      setServiceName(serviceNames[0] ?? "");
    }
  }, [serviceName, serviceNames]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MARKETPLACE_REVIEWS_STORAGE_KEY) bump();
    };
    const onCustom = () => bump();
    window.addEventListener("storage", onStorage);
    window.addEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, onCustom);
    };
  }, [bump]);

  // Fetch deal-based reviews from server and merge into localStorage
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/profile/reviews?provider=${encodeURIComponent(providerSlug)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { reviews: MarketplaceReview[] };
        if (!data.reviews.length) return;
        // Merge into localStorage (skip duplicates by id)
        const existing = mergedReviewsForProvider(providerSlug);
        const existingIds = new Set(existing.map((r) => r.id));
        let added = false;
        for (const r of data.reviews) {
          if (!existingIds.has(r.id)) {
            appendUserReview({ ...r, reviewerWallet: "deal-review", unsigned: true });
            added = true;
          }
        }
        if (added) bump();
      } catch { /* ignore */ }
    })();
  }, [providerSlug, bump]);

  const reviews = useMemo(() => {
    void version;
    return mergedReviewsForProvider(providerSlug);
  }, [providerSlug, version]);

  const summary = useMemo(
    () =>
      reputationFromReviewList(reviews, {
        listingRating: fallbackRating,
        reviewCount: fallbackReviewCount,
      }),
    [reviews, fallbackRating, fallbackReviewCount],
  );

  const hasNumeric =
    summary.reviewCount > 0 && summary.avgRating != null;

  const submit = async () => {
    setErr(null);
    setOk(null);
    if (!wallet.publicKey) {
      setErr("Connect a wallet to submit a test review.");
      return;
    }
    if (!serviceName) {
      setErr("Pick which service this review is for.");
      return;
    }
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setErr("Write at least 20 characters (scaffold minimum).");
      return;
    }
    if (rating < 1 || rating > 5) {
      setErr("Pick a rating from 1 to 5.");
      return;
    }

    const reviewerWallet = wallet.publicKey.toBase58();
    const createdAt = new Date().toISOString();
    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const payload = canonicalReviewPayload({
      providerSlug,
      serviceName,
      reviewerWallet,
      rating,
      text: trimmed,
      createdAt,
    });

    setBusy(true);
    try {
      let signatureBase58: string | undefined;
      let unsigned = false;
      const msgBytes = new TextEncoder().encode(payload);
      if (wallet.signMessage) {
        try {
          const sig = await wallet.signMessage(msgBytes);
          signatureBase58 = bs58.encode(sig);
        } catch {
          unsigned = true;
        }
      } else {
        unsigned = true;
      }

      const review: MarketplaceReview = {
        id,
        providerSlug,
        serviceName,
        reviewerWallet,
        rating,
        text: trimmed,
        createdAt,
        signatureBase58,
        unsigned: unsigned || !signatureBase58,
      };
      appendUserReview(review);
      setText("");
      setRating(5);
      bump();
      setOk(
        review.unsigned
          ? "Saved without wallet signature (adapter did not sign)."
          : "Review saved with wallet signature.",
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="provider-reviews"
      className="polish-section max-w-full min-w-0 scroll-mt-24 rounded-3xl bg-zinc-950/38 p-4 sm:p-6"
      aria-labelledby="reputation-heading"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2
            id="reputation-heading"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
          >
            All reviews
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Combined feedback across every listed service. Off-chain scaffold
            (seed + your browser); production ties reviews to completed jobs.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          {hasNumeric ? (
            <>
              <span
                role="img"
                aria-label={`${summary.avgRating!.toFixed(1)} out of 5 stars overall`}
              >
                <ReputationStarRow
                  rating={summary.avgRating!}
                  className="text-2xl sm:text-3xl"
                />
              </span>
              <p className="text-lg font-semibold text-zinc-100">
                {formatReputationLine(summary)}
              </p>
            </>
          ) : (
            <p className="text-base text-zinc-500">
              {formatReputationLine(summary)}
            </p>
          )}
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <li className="text-sm text-zinc-500">No reviews yet.</li>
        ) : (
          reviews.map((r) => (
            <li
              key={r.id}
              className="polish-trust-tile rounded-xl border border-white/[0.06] p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="rounded border border-white/12 bg-zinc-900/70 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                  {r.serviceName}
                </span>
                <span className="font-medium text-zinc-300">
                  {r.rating} / 5 stars
                </span>
                <span>·</span>
                <span className="font-mono">
                  {shortenWallet(r.reviewerWallet)}
                </span>
                <span>·</span>
                <time dateTime={r.createdAt}>
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                {r.unsigned ? (
                  <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-600">
                    Unsigned
                  </span>
                ) : (
                  <span className="rounded border border-emerald-500/25 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400/90">
                    Wallet signed
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {r.text}
              </p>
            </li>
          ))
        )}
      </ul>

      <div className="mt-8 border-t border-white/[0.08] pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Add test review (dev scaffold)
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Tag the service so it rolls into the right column above. Signs a
          canonical JSON payload when the adapter supports{" "}
          <code className="text-zinc-500">signMessage</code>.
        </p>
        {serviceNames.length > 0 ? (
          <label className="mt-4 block">
            <span className="text-xs text-zinc-500">Service</span>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="mt-1 w-full max-w-md rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
            >
              {serviceNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                rating === n
                  ? "border-white/25 bg-zinc-800 text-zinc-100"
                  : "border-white/10 text-zinc-400 hover:border-white/20"
              }`}
            >
              {n} ★
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-xs text-zinc-500">Review text</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            placeholder="At least 20 characters…"
          />
        </label>
        {err ? <p className="mt-2 text-xs text-red-400">{err}</p> : null}
        {ok ? <p className="mt-2 text-xs text-emerald-400/90">{ok}</p> : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="mt-4 rounded-lg border border-white/15 bg-zinc-800/90 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </section>
  );
}
