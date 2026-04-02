import { NextResponse } from "next/server";
import { getUserByUsername, getUserByWallet } from "@/lib/dev-marketplace-store";

/** GET /api/profile/lookup?username=foo or ?wallet=abc */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username");
  const wallet = url.searchParams.get("wallet");

  if (username) {
    const user = getUserByUsername(username);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ wallet: user.wallet, username: user.username });
  }

  if (wallet) {
    const user = getUserByWallet(wallet);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ wallet: user.wallet, username: user.username });
  }

  return NextResponse.json({ error: "Provide ?username or ?wallet" }, { status: 400 });
}
