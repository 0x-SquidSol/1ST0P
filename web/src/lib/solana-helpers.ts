import type { Connection, PublicKey } from "@solana/web3.js";

export async function realSolHeldByAccount(
  connection: Connection,
  address: PublicKey,
): Promise<bigint> {
  const acc = await connection.getAccountInfo(address);
  if (!acc) return BigInt(0);
  const rent = BigInt(
    await connection.getMinimumBalanceForRentExemption(acc.data.length),
  );
  return BigInt(acc.lamports) - rent;
}
