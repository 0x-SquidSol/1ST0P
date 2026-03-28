const STEPS = [
  {
    title: "Providers apply and get reviewed",
    body: "Service providers submit an application. 1ST0P reviews each profile manually before anyone can appear in public listings.",
  },
  {
    title: "You browse by category",
    body: "Explore service categories and approved provider profiles. Compare skills, rates, and proof of past delivery.",
  },
  {
    title: "You hire through 1ST0P",
    body: "Engagements are created on-platform so scope, timeline, and commercial terms are recorded—not lost in ad-hoc DMs.",
  },
  {
    title: "Funds are held in escrow",
    body: "The provider’s compensation plus the platform fee are held in treasury/escrow until completion rules you agreed up front are satisfied. The platform fee is the greater of 1% of the booked amount or a published minimum fee (for example 0.1 SOL on devnet—final schedule is shown before you pay).",
  },
  {
    title: "Completion and payout",
    body: "When work is marked complete, the buyer confirms outcomes. The provider is paid according to the agreed release rules.",
  },
  {
    title: "Buyer rating and review",
    body: "After completion, the buyer submits a 1–5 star rating and a written review. This closes the loop on reputation and is required before final closeout.",
  },
];

export function MarketplaceHowItWorks({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <section
        id="how-it-works"
        className="polish-section max-w-full min-w-0 scroll-mt-24 rounded-2xl bg-zinc-950/38 p-3 sm:p-4"
        aria-labelledby="how-it-works-heading"
      >
        <h2
          id="how-it-works-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
        >
          How it works
        </h2>
        <p className="mt-1.5 text-[11px] leading-snug text-zinc-500">
          Intended flow; escrow checkout ships next.{" "}
          <span className="text-zinc-600">Scroll for detail.</span>
        </p>
        <ol className="mt-3 max-h-[min(52vh,28rem)] space-y-2 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-2 border-b border-white/[0.06] pb-2 last:border-b-0 last:pb-0"
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 text-[10px] font-semibold text-zinc-400"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-[11px] font-semibold leading-tight text-zinc-200">
                  {step.title}
                </h3>
                <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="polish-trust-tile mt-3 rounded-lg p-2.5 text-[10px] leading-snug text-zinc-400">
          <h3 className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
            If something goes wrong
          </h3>
          <p className="mt-1.5 text-zinc-500">
            Formal review of scope, messages, and delivery evidence. Provider
            paid if standard met; otherwise buyer may receive refund of escrowed
            funds for that milestone,{" "}
            <span className="text-zinc-400">minus platform fee</span> per
            policy. Final terms before live funds.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="how-it-works"
      className="polish-section max-w-full min-w-0 scroll-mt-24 rounded-3xl bg-zinc-950/38 p-4 sm:p-6 md:p-8"
      aria-labelledby="how-it-works-heading"
    >
      <h2
        id="how-it-works-heading"
        className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
      >
        How it works
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-400">
        End-to-end flow for hiring on 1ST0P. Exact checkout and contract UI will
        ship as we wire escrow; this is the intended experience.
      </p>
      <ol className="mt-6 space-y-5">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 border-b border-white/5 pb-5 last:border-b-0 last:pb-0"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-zinc-900/70 text-sm font-semibold text-zinc-200"
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="polish-trust-tile mt-8 rounded-xl p-4 text-sm leading-relaxed text-zinc-300">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          If something goes wrong
        </h3>
        <p className="mt-2 text-zinc-400">
          If deliverables do not match what both sides agreed, or the buyer
          cannot accept that work was completed, 1ST0P can open a formal review.
          We examine the engagement record (scope, messages, and evidence of
          delivery). If we find the provider met the agreed standard, the
          provider is paid per contract. If we find the work did not meet the
          agreed standard, the buyer may receive a full refund of escrowed funds
          attributable to that milestone,{" "}
          <span className="text-zinc-300">minus the platform service fee</span>{" "}
          where policy allows. Final policy language will be published before
          live money movement.
        </p>
      </div>
    </section>
  );
}
