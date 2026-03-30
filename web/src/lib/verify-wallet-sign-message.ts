import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

export function verifyWalletSignMessage(
  walletBase58: string,
  messageUtf8: string,
  signatureBase58: string,
): boolean {
  try {
    const pk = new PublicKey(walletBase58);
    const msg = new TextEncoder().encode(messageUtf8);
    const sig = bs58.decode(signatureBase58);
    return nacl.sign.detached.verify(msg, sig, pk.toBytes());
  } catch {
    return false;
  }
}

export function loginMessageText(wallet: string, nonce: string): string {
  return `1ST0P Messages login\nWallet: ${wallet}\nNonce: ${nonce}`;
}

export function parseLoginMessage(
  message: string,
): { wallet: string; nonce: string } | null {
  const parts = message.split("\n");
  if (parts.length !== 3) return null;
  if (parts[0] !== "1ST0P Messages login") return null;
  if (!parts[1]?.startsWith("Wallet: ")) return null;
  if (!parts[2]?.startsWith("Nonce: ")) return null;
  return {
    wallet: parts[1].slice("Wallet: ".length),
    nonce: parts[2].slice("Nonce: ".length),
  };
}
