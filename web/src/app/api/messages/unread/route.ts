import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  listThreadsForWallet,
  listDealThreadsForWallet,
} from "@/lib/dev-marketplace-store";

/**
 * GET /api/messages/unread — returns message counts for the current wallet.
 * Counts application threads + deal chats that have activity.
 */
export async function GET() {
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ count: 0 });
  }

  const appThreads = listThreadsForWallet(session.wallet);
  const dealThreads = listDealThreadsForWallet(session.wallet);

  // Count threads with messages beyond the initial system message
  const activeAppThreads = appThreads.filter((t) => t.messages.length > 1).length;
  const activeDealThreads = dealThreads.filter(
    (d) => d.status !== "cancelled" && d.status !== "completed" && d.messages.length > 1,
  ).length;

  return NextResponse.json({
    count: activeAppThreads + activeDealThreads,
    deals: activeDealThreads,
    applications: activeAppThreads,
  });
}
