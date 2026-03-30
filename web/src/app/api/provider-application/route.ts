import { NextResponse } from "next/server";
import { addApplicationWithThread } from "@/lib/dev-marketplace-store";
import {
  providerApplicationSchema,
} from "@/lib/provider-application-schema";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = providerApplicationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const { applicationId, threadId } = addApplicationWithThread(parsed.data);

  return NextResponse.json(
    {
      applicationId,
      threadId,
      receivedAt: new Date().toISOString(),
      messagesUrl: "/marketplace/messages",
      demo: true,
      message:
        "Application accepted (demo). Open Messages with the same wallet to view your thread. Data resets on server restart until Phase 6 persistence.",
    },
    { status: 201 },
  );
}
