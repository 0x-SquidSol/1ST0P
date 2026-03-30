import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OPERATOR_SESSION_COOKIE,
  readOperatorSession,
} from "@/lib/messages-session-cookie";
import { listAllThreads } from "@/lib/dev-marketplace-store";

export async function GET() {
  const jar = await cookies();
  const op = readOperatorSession(jar.get(OPERATOR_SESSION_COOKIE)?.value);
  if (!op) {
    return NextResponse.json({ error: "Operator sign-in required" }, { status: 401 });
  }

  const threads = listAllThreads()
    .map((t) => ({
      id: t.id,
      applicationId: t.applicationId,
      participantWallet: t.participantWallet,
      status: t.status,
      updatedAt: t.updatedAt,
      messageCount: t.messages.length,
      preview: t.messages[t.messages.length - 1]?.body.slice(0, 100) ?? "",
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return NextResponse.json({ threads });
}
