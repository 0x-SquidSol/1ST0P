"use client";

import { FormEvent, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

const PROJECT_X_URL = "#";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"" | "ready" | "error">("");

  const isValid = useMemo(
    () => name.trim().length >= 2 && message.trim().length >= 25,
    [name, message],
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (honeypot.trim().length > 0) {
      setStatus("error");
      return;
    }

    if (!isValid) {
      setStatus("error");
      return;
    }

    if (!CONTACT_EMAIL) {
      setStatus("error");
      return;
    }

    const subject = encodeURIComponent(`1ST0P Contact — ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\nFrom: ${name.trim()}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setStatus("ready");
  }

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/50 p-8">
        <PageHeader
          label="Contact"
          title="Get in Touch"
          description="Use this page to contact the 1ST0P team. A project X link and direct email sink can be finalized as soon as your official contact details are ready."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <article className="rounded-2xl border border-white/10 bg-zinc-950/40 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-zinc-100">Project Links</h2>
          <p className="mt-3 text-sm text-zinc-400">
            Keep this section minimal and high-signal. Replace the placeholder X
            URL once your official account is live.
          </p>
          <a
            href={PROJECT_X_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-lg border border-white/15 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/25 hover:text-white"
          >
            Project X (placeholder)
          </a>
        </article>

        <article className="rounded-2xl border border-white/10 bg-zinc-950/40 p-6 lg:col-span-3">
          <h2 className="text-lg font-semibold text-zinc-100">Contact Form</h2>
          <p className="mt-3 text-sm text-zinc-400">
            Messages route to the configured project email. Basic anti-spam guard
            is enabled with a hidden honeypot field and minimum input length.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-white/25"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-white/15 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-white/25"
                placeholder="Write your message..."
              />
            </div>

            <input
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden
            />

            <button
              type="submit"
              disabled={!isValid}
              className="inline-flex rounded-lg border border-white/15 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
            </button>

            {status === "error" ? (
              <p className="text-xs text-zinc-500">
                Submit failed. Ensure name/message are filled and set{" "}
                <code className="text-zinc-400">NEXT_PUBLIC_CONTACT_EMAIL</code>{" "}
                when ready.
              </p>
            ) : null}
            {status === "ready" ? (
              <p className="text-xs text-zinc-500">
                Preparing your email client with the message details.
              </p>
            ) : null}
          </form>
        </article>
      </section>
    </div>
  );
}

