type TxPhase = "idle" | "preparing" | "submitted" | "confirmed" | "failed";

export type TxStatusState = {
  phase: TxPhase;
  message?: string;
  signature?: string;
};

export function TxStatus({
  status,
  compact = false,
}: {
  status: TxStatusState;
  compact?: boolean;
}) {
  if (status.phase === "idle") return null;

  const tone =
    status.phase === "failed"
      ? "border-red-400/30 bg-red-500/10 text-red-200"
      : status.phase === "confirmed"
        ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
        : "border-white/15 bg-zinc-900/70 text-zinc-200";

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-xs ${tone} ${
        compact ? "" : "mt-3"
      }`}
    >
      <p className="font-semibold uppercase tracking-[0.16em]">{status.phase}</p>
      {status.message ? <p className="mt-1 text-[12px]">{status.message}</p> : null}
      {status.signature ? (
        <p className="mt-1 break-all font-mono text-[10px] opacity-85">
          {status.signature}
        </p>
      ) : null}
    </div>
  );
}

