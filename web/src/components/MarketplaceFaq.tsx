const ITEMS: { q: string; a: string }[] = [
  {
    q: "Who can appear in the public marketplace?",
    a: "Only providers who applied and passed manual review. Until that flow is live, sample profiles are placeholders for layout and copy.",
  },
  {
    q: "How does payment work?",
    a: "Engagements are designed to run on-platform with funds held in treasury/escrow until agreed completion rules are met. Exact checkout ships with the escrow UI.",
  },
  {
    q: "What is the platform fee?",
    a: "The fee is the greater of 1% of the booked amount and a published minimum (for example 0.1 SOL on devnet). Final numbers are shown before you commit funds.",
  },
  {
    q: "Are reviews required?",
    a: "Yes. Buyers submit a star rating and a written review at closeout so reputation stays tied to real outcomes.",
  },
  {
    q: "What if a job goes wrong?",
    a: "There is a formal review path using the engagement record, messages, and delivery evidence. Outcomes depend on what both sides agreed; policy detail will be published before live money movement.",
  },
];

export function MarketplaceFaq() {
  return (
    <section
      className="polish-section max-w-full min-w-0 rounded-2xl bg-zinc-950/38 p-4 sm:p-6 md:p-8"
      aria-labelledby="marketplace-faq-heading"
    >
      <h2
        id="marketplace-faq-heading"
        className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
      >
        FAQs
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Short answers for the marketplace lane. Legal and fee schedules will
        live in dedicated policy pages before production checkout.
      </p>
      <dl className="mt-8 space-y-8">
        {ITEMS.map((item) => (
          <div key={item.q} className="border-b border-white/[0.06] pb-8 last:border-b-0 last:pb-0">
            <dt className="text-sm font-medium text-zinc-100">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-zinc-400">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
