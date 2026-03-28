import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

const docLinks = [
  {
    title: "Product Requirements",
    description:
      "Foundational requirements for launch teams, marketplace flows, trust model, and acceptance criteria.",
    href: "https://github.com/0x-SquidSol/1ST0P/blob/main/docs/product-requirements.md",
  },
  {
    title: "Information Architecture",
    description:
      "Global navigation, lane ownership, and route structure for Home, Launch, Marketplace, and Trade.",
    href: "https://github.com/0x-SquidSol/1ST0P/blob/main/docs/information-architecture.md",
  },
  {
    title: "UX Acceptance Checklist",
    description:
      "Release-gate checklist for states, trust copy, wallet behavior, accessibility, and error handling.",
    href: "https://github.com/0x-SquidSol/1ST0P/blob/main/docs/ux-acceptance-checklist.md",
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="polish-surface-page rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Docs"
          title="Documentation Hub"
          description="Read the current platform docs covering architecture, requirements, and quality gates."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {docLinks.map((doc) => (
          <a
            key={doc.title}
            href={doc.href}
            target="_blank"
            rel="noreferrer"
            className="polish-card-interactive flex min-h-[190px] flex-col rounded-2xl bg-zinc-950/42 p-6"
          >
            <h2 className="text-lg font-semibold text-zinc-100">{doc.title}</h2>
            <p className="mt-3 text-sm text-zinc-400">{doc.description}</p>
            <span className="mt-auto text-sm text-zinc-200 underline decoration-white/20 underline-offset-4">
              Open document
            </span>
          </a>
        ))}
      </section>

      <section className="polish-surface-subtle rounded-2xl p-6 text-sm text-zinc-400">
        Looking for launch actions? Visit{" "}
        <Link href="/launch" className="text-zinc-200 hover:text-white">
          Launch
        </Link>
        . Looking for service listings? Visit{" "}
        <Link href="/marketplace" className="text-zinc-200 hover:text-white">
          Marketplace
        </Link>
        .
      </section>
    </div>
  );
}

