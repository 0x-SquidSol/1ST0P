"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchPrimitives";
import { shortenWallet } from "@/lib/marketplace-reviews";
import {
  MARKETPLACE_SERVICES,
  OTHER_SERVICE_OPTION,
} from "@/lib/marketplace-services";
import type { ProviderRateModel } from "@/lib/provider-profile";
import type { ProviderApplicationPayload } from "@/lib/provider-application-schema";
import { providerApplicationSchema } from "@/lib/provider-application-schema";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

const SERVICE_NAMES = MARKETPLACE_SERVICES.map((s) => s.name);

const RATE_LABELS: Record<ProviderRateModel, string> = {
  hourly: "Hourly",
  fixed_range: "Fixed / range",
  project: "Project-based",
  custom: "Custom quote",
};

const RATE_OPTIONS = Object.keys(RATE_LABELS) as ProviderRateModel[];

type OfferingDraft = {
  serviceName: string;
  /** Required when `serviceName` is Other — reviewer maps to catalog or creates category */
  requestedServiceLabel: string;
  tagsInput: string;
  rateModel: ProviderRateModel;
  rateSummary: string;
};

type ProofDraft = {
  title: string;
  description: string;
  href: string;
};

const emptyOffering = (): OfferingDraft => ({
  serviceName: "",
  requestedServiceLabel: "",
  tagsInput: "",
  rateModel: "hourly",
  rateSummary: "",
});

function offeringDraftKey(o: OfferingDraft): string {
  if (o.serviceName === OTHER_SERVICE_OPTION) {
    return `other:${o.requestedServiceLabel.trim().toLowerCase()}`;
  }
  return o.serviceName.trim();
}

export function ProviderApplicationWizard() {
  const wallet = useWallet();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [offerings, setOfferings] = useState<OfferingDraft[]>([emptyOffering()]);
  const [proof, setProof] = useState<ProofDraft[]>([]);
  const [priorDeliveryNotes, setPriorDeliveryNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [github, setGithub] = useState("");
  const [escrowAck, setEscrowAck] = useState(false);
  const [buyerReviewAck, setBuyerReviewAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    applicationId: string;
    threadId: string;
    receivedAt: string;
  } | null>(null);

  const stepMeta = useMemo(
    () => [
      { n: 1, label: "Profile" },
      { n: 2, label: "Services" },
      { n: 3, label: "Portfolio" },
      { n: 4, label: "Links" },
      { n: 5, label: "Review" },
    ],
    [],
  );

  function buildPayload(): ProviderApplicationPayload {
    const pk = wallet.publicKey?.toBase58();
    if (!pk) throw new Error("Wallet not connected");
    return {
      applicantWallet: pk,
      displayName: displayName.trim(),
      headline: headline.trim(),
      bio: bio.trim(),
      offerings: offerings.map((o) => ({
        serviceName: o.serviceName.trim(),
        requestedServiceLabel:
          o.serviceName === OTHER_SERVICE_OPTION
            ? o.requestedServiceLabel.trim()
            : undefined,
        tags: o.tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10),
        rateModel: o.rateModel,
        rateSummary: o.rateSummary.trim(),
      })),
      proof: proof
        .filter((p) => p.title.trim() && p.description.trim())
        .map((p) => ({
          title: p.title.trim(),
          description: p.description.trim(),
          href: p.href.trim() || undefined,
        })),
      priorDeliveryNotes: priorDeliveryNotes.trim() || undefined,
      socialLinks: {
        website: website.trim() || undefined,
        x: xUrl.trim() || undefined,
        github: github.trim() || undefined,
      },
      acknowledgements: {
        escrowUntilComplete: true as const,
        buyerReviewAfterWork: true as const,
      },
    };
  }

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (displayName.trim().length < 2) return "Enter your team or display name.";
      if (headline.trim().length < 8) return "Headline is too short.";
      if (bio.trim().length < 40) return "Bio should be at least 40 characters.";
    }
    if (current === 2) {
      if (offerings.length < 1) return "Add at least one service.";
      for (const o of offerings) {
        if (!o.serviceName.trim()) return "Pick a marketplace service for each row.";
        if (o.serviceName === OTHER_SERVICE_OPTION) {
          if (o.requestedServiceLabel.trim().length < 3) {
            return "Describe each “Other” service (at least 3 characters).";
          }
        }
        if (o.rateSummary.trim().length < 4) return "Add a short rate line for each service.";
      }
      const keys = offerings.map(offeringDraftKey);
      if (new Set(keys).size !== keys.length) {
        return "Each service row must be unique (including two different “Other” descriptions).";
      }
    }
    if (current === 3) {
      for (const p of proof) {
        if (!p.title.trim() && !p.description.trim()) continue;
        if (p.title.trim().length < 2 || p.description.trim().length < 12) {
          return "Complete portfolio rows or clear them.";
        }
      }
    }
    if (current === 4) {
      const any =
        website.trim().length > 0 ||
        xUrl.trim().length > 0 ||
        github.trim().length > 0;
      if (!any) return "Add at least one of Website, X, or GitHub.";
    }
    return null;
  }

  async function submit() {
    setSubmitError(null);
    if (!wallet.publicKey) {
      setSubmitError("Connect your wallet to submit.");
      return;
    }
    if (!escrowAck || !buyerReviewAck) {
      setSubmitError("Confirm escrow and review policy on this page.");
      return;
    }
    let payload: ProviderApplicationPayload;
    try {
      payload = buildPayload();
    } catch {
      setSubmitError("Connect your wallet to submit.");
      return;
    }
    const parsed = providerApplicationSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(" ");
      setSubmitError(msg || "Check the form for errors.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/provider-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as {
        error?: string;
        applicationId?: string;
        threadId?: string;
        receivedAt?: string;
      };
      if (!res.ok) {
        setSubmitError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      if (data.applicationId && data.receivedAt) {
        setDone({
          applicationId: data.applicationId,
          threadId: data.threadId ?? "",
          receivedAt: data.receivedAt,
        });
      }
    } catch {
      setSubmitError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="min-w-0 space-y-8 sm:space-y-10">
        <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
          <PageHeader
            label="Marketplace"
            title="Application received"
            description="This submission is tied to your connected wallet. Nothing appears on your public provider page or in marketplace search until an admin approves you in the internal dashboard. A Messages thread was created—open it with the same wallet (sign once to unlock). Dev data resets when the server restarts."
          />
          <p className="mt-4 font-mono text-xs text-zinc-500">
            Reference ID: {done.applicationId}
          </p>
          {done.threadId ? (
            <p className="mt-1 font-mono text-xs text-zinc-600">
              Thread ID: {done.threadId}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-600">{done.receivedAt}</p>
          <p className="mt-6 flex flex-wrap gap-3">
            <Link
              href={
                done.threadId
                  ? `/marketplace/messages/${done.threadId}`
                  : "/marketplace/messages"
              }
              className="polish-cta-link inline-flex rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950"
            >
              Open Messages
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex rounded-lg border border-white/15 bg-zinc-900/85 px-4 py-2 text-sm text-zinc-100"
            >
              Back to marketplace
            </Link>
            <Link
              href="/marketplace?tab=search"
              className="text-sm text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
            >
              Service search
            </Link>
          </p>
        </section>
      </div>
    );
  }

  const stepErr = validateStep(step);
  const canAdvance = step < 5 && !validateStep(step);

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Apply as a service provider"
          description="Multi-step intake. Reviewers reach you through in-app Messages (/marketplace/messages) — no email on this form."
        />
        <nav
          className="mt-5 flex flex-wrap gap-2 border-b border-white/[0.06] pb-4"
          aria-label="Form steps"
        >
          {stepMeta.map((s) => (
            <span
              key={s.n}
              className={`rounded-lg px-3 py-1 text-xs font-medium ${
                step === s.n
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-600"
              }`}
            >
              {s.n}. {s.label}
            </span>
          ))}
        </nav>
        <div className="mt-5 space-y-4 border-b border-white/[0.06] pb-6">
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            <span className="font-medium text-zinc-300">Wallet required.</span>{" "}
            Connect the Solana wallet that will own this provider listing. Your
            application and future Messages are tied to this address.
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            <span className="font-medium text-zinc-300">One application, up to three services.</span>{" "}
            Add each marketplace service you offer in step 2 (max three different
            services on this form). If you need more than three, submit a separate
            application for the additional services.
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            <span className="font-medium text-zinc-300">Not live until approved.</span>{" "}
            Your answers are not shown on your public provider profile or tied to
            marketplace listings until an admin approves this application in the
            internal dashboard.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <WalletMultiButton className="wallet-btn !rounded-lg !border !border-white/15 !bg-zinc-900/90 !px-4 !py-2 !text-sm !font-medium" />
            {wallet.publicKey ? (
              <span className="font-mono text-xs text-zinc-500">
                {shortenWallet(wallet.publicKey.toBase58(), 6)}
              </span>
            ) : (
              <span className="text-xs text-amber-400/90">
                Connect before continuing past profile.
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        {step === 1 ? (
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Profile
            </h2>
            <label className="block">
              <span className="text-xs text-zinc-500">Listing name</span>
              <SearchInput
                value={displayName}
                onChange={setDisplayName}
                placeholder="Your name, agency, or company (shown on your public listing)"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Headline</span>
              <SearchInput
                value={headline}
                onChange={setHeadline}
                placeholder="One line — what you deliver"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">About</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={6}
                className="mt-1 w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                placeholder="Minimum 40 characters. Who you are, how you work, Solana focus…"
              />
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Services (max 3)
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-zinc-500">
              Each row is one marketplace service buyers can hire you for. If your
              role isn&apos;t listed yet, choose{" "}
              <span className="text-zinc-400">Other</span> and describe it—on
              approval, we&apos;ll either add an appropriate category or map you to
              an existing one. When a buyer wants to move forward, you&apos;ll align
              on scope and price through 1ST0P messaging; once you agree, the
              platform will capture that in a structured engagement (escrow-backed
              terms in a later release—not informal one-off &quot;custom
              contracts&quot; unless you choose to layer legal review outside the
              product).
            </p>
            {offerings.map((o, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-300">
                    Service {idx + 1}
                  </span>
                  {offerings.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOfferings((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-xs text-zinc-500 underline decoration-white/15"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <label className="block">
                  <span className="text-xs text-zinc-500">Marketplace service</span>
                  <select
                    value={o.serviceName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setOfferings((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? {
                                ...row,
                                serviceName: v,
                                requestedServiceLabel:
                                  v === OTHER_SERVICE_OPTION
                                    ? row.requestedServiceLabel
                                    : "",
                              }
                            : row,
                        ),
                      );
                    }}
                    className="mt-1 w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="">Select…</option>
                    {SERVICE_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value={OTHER_SERVICE_OPTION}>
                      Other — not listed yet (describe below)
                    </option>
                  </select>
                </label>
                {o.serviceName === OTHER_SERVICE_OPTION ? (
                  <label className="block">
                    <span className="text-xs text-zinc-500">
                      Describe the service you offer
                    </span>
                    <textarea
                      value={o.requestedServiceLabel}
                      onChange={(e) =>
                        setOfferings((prev) =>
                          prev.map((row, i) =>
                            i === idx
                              ? {
                                  ...row,
                                  requestedServiceLabel: e.target.value,
                                }
                              : row,
                          ),
                        )
                      }
                      rows={2}
                      maxLength={120}
                      className="mt-1 w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                      placeholder="e.g. Motion design for launch trailers, tokenomics advisory…"
                    />
                    <p className="mt-1 text-xs text-zinc-600">
                      Reviewers use this to approve a new category or assign you to
                      an existing marketplace service.
                    </p>
                  </label>
                ) : null}
                <label className="block">
                  <span className="text-xs text-zinc-500">
                    Tags (comma-separated)
                  </span>
                  <SearchInput
                    value={o.tagsInput}
                    onChange={(v) =>
                      setOfferings((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, tagsInput: v } : row,
                        ),
                      )
                    }
                    placeholder="e.g. Anchor, Next.js, audits"
                  />
                </label>
                <div>
                  <span className="text-xs text-zinc-500">Rate model</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {RATE_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setOfferings((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, rateModel: m } : row,
                            ),
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          o.rateModel === m
                            ? "border-white/25 bg-zinc-800 text-zinc-100"
                            : "border-white/10 text-zinc-400 hover:border-white/20"
                        }`}
                      >
                        {RATE_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="text-xs text-zinc-500">Rate summary (one line)</span>
                  <SearchInput
                    value={o.rateSummary}
                    onChange={(v) =>
                      setOfferings((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, rateSummary: v } : row,
                        ),
                      )
                    }
                    placeholder="e.g. $95–140/hr or From 12 SOL / week"
                  />
                </label>
              </div>
            ))}
            {offerings.length < 3 ? (
              <button
                type="button"
                onClick={() => setOfferings((prev) => [...prev, emptyOffering()])}
                className="text-sm font-medium text-zinc-400 underline decoration-white/20"
              >
                + Add another service
              </button>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Portfolio
            </h2>
            <p className="text-xs text-zinc-600">
              Optional rows. File uploads ship with backend storage (Phase 6).
            </p>
            {proof.map((p, idx) => (
              <div
                key={idx}
                className="space-y-2 rounded-xl border border-white/[0.08] p-3"
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setProof((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-xs text-zinc-500 underline"
                  >
                    Remove
                  </button>
                </div>
                <SearchInput
                  value={p.title}
                  onChange={(v) =>
                    setProof((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, title: v } : row)),
                    )
                  }
                  placeholder="Title"
                />
                <textarea
                  value={p.description}
                  onChange={(e) =>
                    setProof((prev) =>
                      prev.map((row, i) =>
                        i === idx ? { ...row, description: e.target.value } : row,
                      ),
                    )
                  }
                  rows={3}
                  className="w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
                  placeholder="Description (min 12 chars if you use this row)"
                />
                <SearchInput
                  value={p.href}
                  onChange={(v) =>
                    setProof((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, href: v } : row)),
                    )
                  }
                  placeholder="Link (optional)"
                />
              </div>
            ))}
            {proof.length < 8 ? (
              <button
                type="button"
                onClick={() =>
                  setProof((prev) => [
                    ...prev,
                    { title: "", description: "", href: "" },
                  ])
                }
                className="text-sm text-zinc-400 underline decoration-white/20"
              >
                + Add portfolio item
              </button>
            ) : null}
            <label className="mt-4 block">
              <span className="text-xs text-zinc-500">
                Prior delivery notes (optional)
              </span>
              <textarea
                value={priorDeliveryNotes}
                onChange={(e) => setPriorDeliveryNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
                placeholder="Notable clients, engagements, references…"
              />
            </label>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Public links
            </h2>
            <p className="text-xs text-zinc-600">
              At least one URL required — these become the Website / X / GitHub buttons on your listing.
            </p>
            <label className="block">
              <span className="text-xs text-zinc-500">Website</span>
              <SearchInput value={website} onChange={setWebsite} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">X (Twitter)</span>
              <SearchInput value={xUrl} onChange={setXUrl} placeholder="https://x.com/…" />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">GitHub</span>
              <SearchInput value={github} onChange={setGithub} placeholder="https://github.com/…" />
            </label>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4 text-sm text-zinc-300">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Review
            </h2>
            <dl className="space-y-3">
              {wallet.publicKey ? (
                <div>
                  <dt className="text-xs text-zinc-600">Wallet</dt>
                  <dd className="font-mono text-xs text-zinc-400">
                    {wallet.publicKey.toBase58()}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-zinc-600">Listing name</dt>
                <dd>{displayName}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-600">Headline</dt>
                <dd>{headline}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-600">Bio</dt>
                <dd className="whitespace-pre-wrap text-zinc-400">{bio}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-600">Services</dt>
                <dd>
                  <ul className="list-inside list-disc text-zinc-400">
                    {offerings.map((o, i) => (
                      <li key={i}>
                        {o.serviceName === OTHER_SERVICE_OPTION
                          ? `Other: ${o.requestedServiceLabel.trim() || "—"}`
                          : o.serviceName || "—"}{" "}
                        · {RATE_LABELS[o.rateModel]} · {o.rateSummary || "—"}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              {proof.some((p) => p.title.trim()) ? (
                <div>
                  <dt className="text-xs text-zinc-600">Portfolio</dt>
                  <dd>
                    <ul className="space-y-1 text-zinc-400">
                      {proof
                        .filter((p) => p.title.trim())
                        .map((p, i) => (
                          <li key={i}>{p.title}</li>
                        ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-zinc-600">Links</dt>
                <dd className="text-zinc-400">
                  {[website && "Website", xUrl && "X", github && "GitHub"]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
            </dl>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/90">
                Important
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                If the service is not completed, or is not completed to the standard you
                and the buyer agree to, the buyer may be refunded and you may lose the
                paid work. You are expected to go above and beyond while maintaining
                professionalism, reliability, and respect when representing 1ST0P as a
                service provider.
              </p>
            </div>

            <div className="space-y-3 border-t border-white/[0.06] pt-4">
              <label className="flex cursor-pointer gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={escrowAck}
                  onChange={(e) => setEscrowAck(e.target.checked)}
                  className="mt-1 rounded border-white/20"
                />
                <span>
                  I understand funds are held in escrow until the contract is complete.
                </span>
              </label>
              <label className="flex cursor-pointer gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={buyerReviewAck}
                  onChange={(e) => setBuyerReviewAck(e.target.checked)}
                  className="mt-1 rounded border-white/20"
                />
                <span>
                  I understand the buyer leaves a review and rating after work is
                  complete.
                </span>
              </label>
            </div>

            {submitError ? (
              <p className="text-xs text-red-400">{submitError}</p>
            ) : null}
          </div>
        ) : null}

        {stepErr && step < 5 ? (
          <p className="mt-4 text-xs text-amber-400/90">{stepErr}</p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-white/[0.06] pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200"
            >
              Back
            </button>
          ) : null}
          {step < 5 ? (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => {
                const err = validateStep(step);
                if (!err) setStep((s) => s + 1);
              }}
              className="rounded-lg border border-white/20 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={
                busy ||
                !wallet.publicKey ||
                !!validateStep(4) ||
                !escrowAck ||
                !buyerReviewAck
              }
              onClick={() => void submit()}
              className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
            >
              {busy ? "Submitting…" : "Submit application"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
