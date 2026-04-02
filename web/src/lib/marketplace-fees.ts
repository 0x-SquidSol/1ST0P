/**
 * Marketplace fee calculations — single source of truth.
 *
 * Platform fee: greater of 1 % of booked amount OR 0.1 SOL minimum.
 * Release fee:  0.025 SOL per payout event (per-milestone release).
 * Network fee:  ~0.000005 SOL per tx (estimate for display only).
 */

/** Minimum platform fee in SOL (flat floor). */
export const MIN_PLATFORM_FEE_SOL = 0.1;

/** Platform fee rate (basis-point friendly: 1 %). */
export const PLATFORM_FEE_RATE = 0.01;

/** Per-payout release fee in SOL. */
export const RELEASE_FEE_SOL = 0.025;

/** Estimated Solana network fee per transaction (display only). */
export const ESTIMATED_NETWORK_FEE_SOL = 0.000005;

export type FeeBreakdown = {
  /** Sum of all milestone amounts. */
  serviceTotalSol: number;
  /** Platform fee: max(1 %, MIN_PLATFORM_FEE_SOL). */
  platformFeeSol: number;
  /** Release fee × number of milestones. */
  totalReleaseFeeSol: number;
  /** Estimated network fees (tx count × estimate). */
  estimatedNetworkFeeSol: number;
  /** Grand total the buyer should expect to pay. */
  grandTotalSol: number;
  /** Number of milestones (drives release fee count). */
  milestoneCount: number;
};

/**
 * Compute the full fee breakdown for a deal.
 *
 * @param milestoneSolAmounts – array of SOL amounts, one per milestone
 */
export function computeFeeBreakdown(
  milestoneSolAmounts: number[],
): FeeBreakdown {
  const serviceTotalSol = milestoneSolAmounts.reduce((a, b) => a + b, 0);
  const milestoneCount = milestoneSolAmounts.length;

  const platformFeeSol = Math.max(
    serviceTotalSol * PLATFORM_FEE_RATE,
    MIN_PLATFORM_FEE_SOL,
  );

  const totalReleaseFeeSol = milestoneCount * RELEASE_FEE_SOL;

  // 1 deposit tx + 1 release tx per milestone (rough estimate)
  const estimatedTxCount = 1 + milestoneCount;
  const estimatedNetworkFeeSol = estimatedTxCount * ESTIMATED_NETWORK_FEE_SOL;

  const grandTotalSol =
    serviceTotalSol + platformFeeSol + totalReleaseFeeSol + estimatedNetworkFeeSol;

  return {
    serviceTotalSol,
    platformFeeSol,
    totalReleaseFeeSol,
    estimatedNetworkFeeSol,
    grandTotalSol,
    milestoneCount,
  };
}

/** Human-friendly fee summary (for chat system messages, emails, etc.). */
export function feeBreakdownText(fb: FeeBreakdown): string {
  const lines = [
    `Service total: ${fb.serviceTotalSol.toFixed(4)} SOL`,
    `Platform fee (≥1 % or ${MIN_PLATFORM_FEE_SOL} SOL min): ${fb.platformFeeSol.toFixed(4)} SOL`,
    `Release fees (${fb.milestoneCount} milestone${fb.milestoneCount === 1 ? "" : "s"} × ${RELEASE_FEE_SOL} SOL): ${fb.totalReleaseFeeSol.toFixed(4)} SOL`,
    `Est. network fees: ~${fb.estimatedNetworkFeeSol.toFixed(6)} SOL`,
    `Grand total: ${fb.grandTotalSol.toFixed(4)} SOL`,
  ];
  return lines.join("\n");
}
