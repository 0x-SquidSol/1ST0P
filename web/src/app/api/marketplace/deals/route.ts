import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  createDealThread,
  getApprovedProfileBySlug,
  getProviderWalletForSlug,
  listDealThreadsForWallet,
  type DealMilestone,
} from "@/lib/dev-marketplace-store";
import { publicOfferings } from "@/lib/provider-profile";

const milestoneSchema = z.object({
  title: z.string().trim().min(2).max(120),
  deliverable: z.string().trim().min(10).max(1000),
  amountSol: z.number().positive().max(1_000_000),
  dueDate: z.string().trim().min(8).max(40),
});

const createDealSchema = z.object({
  providerSlug: z.string().trim().min(2).max(120),
  serviceName: z.string().trim().min(2).max(120),
  projectTitle: z.string().trim().min(4).max(140),
  scopeSummary: z.string().trim().min(20).max(4000),
  startDate: z.string().trim().min(8).max(40),
  targetDate: z.string().trim().min(8).max(40),
  notes: z.string().trim().max(2000).optional(),
  milestones: z.array(milestoneSchema).min(1).max(12),
});

function toSummaryRow(d: {
  id: string;
  providerDisplayName: string;
  providerSlug: string;
  serviceName: string;
  status: string;
  updatedAt: string;
  messages: { body: string }[];
  buyerWallet: string;
  providerWallet: string;
}, wallet: string) {
  const last = d.messages[d.messages.length - 1];
  return {
    id: d.id,
    providerDisplayName: d.providerDisplayName,
    providerSlug: d.providerSlug,
    serviceName: d.serviceName,
    status: d.status,
    updatedAt: d.updatedAt,
    preview: last ? last.body.slice(0, 120) : "",
    messageCount: d.messages.length,
    participantRole: d.buyerWallet === wallet ? "buyer" : "provider",
  };
}

function normalizeMilestones(input: z.infer<typeof milestoneSchema>[]): DealMilestone[] {
  return input.map((m, idx) => ({
    id: `${idx + 1}`,
    title: m.title,
    deliverable: m.deliverable,
    amountSol: m.amountSol,
    dueDate: m.dueDate,
    escrowStatus: "pending" as const,
  }));
}

export async function GET() {
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const list = listDealThreadsForWallet(session.wallet).map((d) =>
    toSummaryRow(d, session.wallet),
  );
  return NextResponse.json({ deals: list, wallet: session.wallet });
}

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
  const parsed = createDealSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deal payload" }, { status: 422 });
  }

  const profile = getApprovedProfileBySlug(parsed.data.providerSlug);
  if (!profile || !profile.approved) {
    return NextResponse.json({ error: "Provider not available" }, { status: 404 });
  }

  const validService = publicOfferings(profile.offerings).some(
    (o) => o.serviceName === parsed.data.serviceName,
  );
  if (!validService) {
    return NextResponse.json({ error: "Service not listed by provider" }, { status: 422 });
  }

  const providerWallet = getProviderWalletForSlug(parsed.data.providerSlug);
  if (!providerWallet) {
    return NextResponse.json(
      { error: "Provider wallet is not linked yet for deal collaboration" },
      { status: 422 },
    );
  }
  if (providerWallet === session.wallet) {
    return NextResponse.json(
      { error: "Buyer and provider cannot be the same wallet" },
      { status: 422 },
    );
  }

  const thread = createDealThread({
    providerSlug: profile.slug,
    providerDisplayName: profile.displayName,
    serviceName: parsed.data.serviceName,
    buyerWallet: session.wallet,
    providerWallet,
    proposal: {
      projectTitle: parsed.data.projectTitle,
      scopeSummary: parsed.data.scopeSummary,
      startDate: parsed.data.startDate,
      targetDate: parsed.data.targetDate,
      notes: parsed.data.notes,
      milestones: normalizeMilestones(parsed.data.milestones),
    },
  });

  return NextResponse.json({ deal: thread });
}
