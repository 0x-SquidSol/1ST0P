import { NextResponse } from "next/server";
import { issueNonce } from "@/lib/messages-nonce-store";

export async function GET() {
  const nonce = issueNonce();
  return NextResponse.json({ nonce });
}
