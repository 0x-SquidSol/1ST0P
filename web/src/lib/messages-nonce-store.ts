import { randomUUID } from "crypto";

/** One-time nonces for wallet sign-in (dev in-memory). */
const g = globalThis as unknown as {
  __1st0pMsgNonces?: Map<string, number>;
};

function map(): Map<string, number> {
  if (!g.__1st0pMsgNonces) g.__1st0pMsgNonces = new Map();
  return g.__1st0pMsgNonces;
}

const TTL_MS = 5 * 60 * 1000;

export function issueNonce(): string {
  const nonce = randomUUID();
  map().set(nonce, Date.now() + TTL_MS);
  return nonce;
}

/** Returns true if nonce was valid and consumed. */
export function consumeNonce(nonce: string): boolean {
  const exp = map().get(nonce);
  if (exp == null || Date.now() > exp) {
    map().delete(nonce);
    return false;
  }
  map().delete(nonce);
  return true;
}
