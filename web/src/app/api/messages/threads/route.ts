import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import { listThreadsForWallet } from "@/lib/dev-marketplace-store";

function threadSummary(t: {
  id: string;
  applicationId: string;
  status: string;
  messages: { body: string }[];
  updatedAt: string;
}) {
  const last = t.messages[t.messages.length - 1];
  return {
    id: t.id,
    applicationId: t.applicationId,
    status: t.status,
    updatedAt: t.updatedAt,
    messageCount: t.messages.length,
    preview: last ? last.body.slice(0, 120) : "",
  };
}

export async function GET() {
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const list = listThreadsForWallet(session.wallet).map(threadSummary);
  list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return NextResponse.json({ threads: list, wallet: session.wallet });
}
