import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  claimUsername,
  getUserByWallet,
} from "@/lib/dev-marketplace-store";

const claimSchema = z.object({
  username: z.string().trim().min(3).max(20),
});

/** GET — check if the current wallet has a username. */
export async function GET() {
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = getUserByWallet(session.wallet);
  return NextResponse.json({
    wallet: session.wallet,
    username: user?.username ?? null,
    createdAt: user?.createdAt ?? null,
  });
}

/** POST — claim a username (one-time, permanent). */
export async function POST(req: Request) {
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username" }, { status: 422 });
  }

  const result = claimUsername(session.wallet, parsed.data.username);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ profile: result });
}
