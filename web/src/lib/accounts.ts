import type { Idl } from "@coral-xyz/anchor";
import { BorshAccountsCoder } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import idl from "@/idl/onestop.json";
import { PROGRAM_ID } from "./constants";
import { bondingCurvePda, globalConfigPda } from "./pdas";

const coder = new BorshAccountsCoder(idl as Idl);

const BONDING_CURVE_DISC = Buffer.from([23, 183, 248, 55, 96, 216, 172, 96]);

export type BondingCurveState = {
  mint: PublicKey;
  creator: PublicKey;
  tokenReserve: bigint;
  virtualSol: bigint;
  bump: number;
  name: string;
  symbol: string;
  uri: string;
  createdAt: bigint;
};

export type GlobalConfigState = {
  authority: PublicKey;
  treasury: PublicKey;
  feeBps: number;
  bump: number;
};

function toU64(n: unknown): bigint {
  if (typeof n === "bigint") return n;
  if (typeof n === "number") return BigInt(n);
  if (n && typeof n === "object" && "toString" in n) {
    return BigInt(String((n as { toString: () => string }).toString()));
  }
  return BigInt(String(n));
}

function toI64(n: unknown): bigint {
  return toU64(n);
}

function pk(x: unknown): PublicKey {
  return x instanceof PublicKey ? x : new PublicKey(x as Uint8Array | string);
}

export function decodeBondingCurve(data: Buffer): BondingCurveState {
  const d = coder.decode("BondingCurve", data) as Record<string, unknown>;
  return {
    mint: pk(d.mint),
    creator: pk(d.creator),
    tokenReserve: toU64(d.tokenReserve),
    virtualSol: toU64(d.virtualSol),
    bump: Number(d.bump),
    name: String(d.name),
    symbol: String(d.symbol),
    uri: String(d.uri),
    createdAt: toI64(d.createdAt),
  };
}

export function decodeGlobalConfig(data: Buffer): GlobalConfigState {
  const d = coder.decode("GlobalConfig", data) as Record<string, unknown>;
  return {
    authority: pk(d.authority),
    treasury: pk(d.treasury),
    feeBps: Number(d.feeBps),
    bump: Number(d.bump),
  };
}

export async function fetchGlobalConfigState(
  connection: Connection,
): Promise<GlobalConfigState | null> {
  const info = await connection.getAccountInfo(globalConfigPda());
  if (!info) return null;
  return decodeGlobalConfig(Buffer.from(info.data));
}

export async function fetchBondingCurveState(
  connection: Connection,
  mint: PublicKey,
): Promise<BondingCurveState | null> {
  const info = await connection.getAccountInfo(bondingCurvePda(mint));
  if (!info) return null;
  return decodeBondingCurve(Buffer.from(info.data));
}

export async function fetchAllBondingCurves(
  connection: Connection,
): Promise<{ address: PublicKey; curve: BondingCurveState }[]> {
  const res = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ memcmp: { offset: 0, bytes: bs58.encode(BONDING_CURVE_DISC) } }],
  });
  return res
    .map((r) => {
      try {
        return {
          address: r.pubkey,
          curve: decodeBondingCurve(Buffer.from(r.account.data)),
        };
      } catch {
        return null;
      }
    })
    .filter((x): x is { address: PublicKey; curve: BondingCurveState } => x !== null)
    .sort((a, b) => Number(b.curve.createdAt - a.curve.createdAt));
}
