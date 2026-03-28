import { type ReactNode } from "react";

function StateCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="polish-state-card rounded-2xl bg-zinc-950/45 p-6">
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StateLoading({
  title = "Loading",
  description = "Please wait while we fetch the latest data.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <StateCard
      title={title}
      description={description}
      action={
        <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
          Syncing...
        </div>
      }
    />
  );
}

export function StateError({
  title = "Something went wrong",
  description = "Try again in a moment.",
  retryLabel = "Retry",
  onRetry,
}: {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <StateCard
      title={title}
      description={description}
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-white/15 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/25 hover:text-white"
          >
            {retryLabel}
          </button>
        ) : null
      }
    />
  );
}

export function StateEmpty({
  title = "Nothing here yet",
  description = "There is no data to display right now.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return <StateCard title={title} description={description} action={action} />;
}

export function StateSuccess({
  title = "Success",
  description = "Your action completed successfully.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <StateCard
      title={title}
      description={description}
      action={
        <span className="inline-flex rounded-full border border-white/10 bg-zinc-900/70 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-300">
          Confirmed
        </span>
      }
    />
  );
}

