/** Decorative star display; pair with aria-label on parent when needed. */
export function ReputationStarRow({
  rating,
  className = "text-lg",
}: {
  rating: number;
  className?: string;
}) {
  const r = Math.min(5, Math.max(0, rating));
  const rounded = Math.round(r);
  return (
    <span
      className={`inline-flex gap-0.5 leading-none tracking-tight ${className}`}
      aria-hidden
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= rounded ? "text-amber-400/95" : "text-zinc-700"}
        >
          ★
        </span>
      ))}
    </span>
  );
}
