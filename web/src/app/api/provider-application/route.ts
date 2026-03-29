import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  providerApplicationSchema,
  type ProviderApplicationPayload,
} from "@/lib/provider-application-schema";

/** Dev-only in-memory store (resets on cold start; replace with DB in Phase 6). */
const g = globalThis as unknown as {
  __providerApplicationStore?: ProviderApplicationPayload[];
};

function getStore(): ProviderApplicationPayload[] {
  if (!g.__providerApplicationStore) {
    g.__providerApplicationStore = [];
  }
  return g.__providerApplicationStore;
}

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

  const store = getStore();
  if (store.length >= 500) {
    store.shift();
  }
  store.push(parsed.data);

  const applicationId = randomUUID();
  return NextResponse.json(
    {
      applicationId,
      receivedAt: new Date().toISOString(),
      demo: true,
      message:
        "Application accepted (demo). Data is not durable—Phase 6 will persist. Use in-app Messages when 6b ships; no email required on the form.",
    },
    { status: 201 },
  );
}
