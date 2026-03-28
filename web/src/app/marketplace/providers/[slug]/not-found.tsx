import Link from "next/link";

export default function ProviderNotFound() {
  return (
    <div className="polish-surface-page max-w-full min-w-0 space-y-4 rounded-3xl bg-zinc-950/52 p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-zinc-100">Provider not found</h1>
      <p className="text-sm text-zinc-400">
        No profile matches this link. Return to service search to browse approved
        providers.
      </p>
      <Link
        href="/marketplace?tab=search"
        className="inline-block text-sm text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-zinc-100"
      >
        Back to service search
      </Link>
    </div>
  );
}
