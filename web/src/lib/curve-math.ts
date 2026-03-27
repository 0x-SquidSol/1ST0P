/** Port of on-chain constant-product leg (virtual SOL + real SOL) × token reserve. */

export function feeFromAmount(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / BigInt(10_000);
}

export function quoteBuy(
  virtualSol: bigint,
  realSol: bigint,
  tokenReserve: bigint,
  solToCurve: bigint,
): { tokensOut: bigint; newTokenReserve: bigint } {
  const rSol = virtualSol + realSol;
  const rTok = tokenReserve;
  if (rTok === BigInt(0)) throw new Error("empty curve");
  const k = rSol * rTok;
  const newRSol = rSol + solToCurve;
  const newRTok = k / newRSol;
  const tokensOut = rTok - newRTok;
  return { tokensOut, newTokenReserve: newRTok };
}

export function quoteSell(
  virtualSol: bigint,
  realSol: bigint,
  tokenReserve: bigint,
  tokenIn: bigint,
): { solOutBeforeFee: bigint; newTokenReserve: bigint } {
  const rSol = virtualSol + realSol;
  const rTok = tokenReserve;
  if (rTok === BigInt(0)) throw new Error("empty curve");
  const k = rSol * rTok;
  const newRTok = rTok + tokenIn;
  const newRSol = k / newRTok;
  const solOut = rSol - newRSol;
  return { solOutBeforeFee: solOut, newTokenReserve: newRTok };
}
