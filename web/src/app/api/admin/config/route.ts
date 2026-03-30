import { NextResponse } from "next/server";
import { adminCredentialsConfigured } from "@/lib/admin-credentials";

/** Public metadata only — no secrets. */
export async function GET() {
  return NextResponse.json({
    credentialsConfigured: adminCredentialsConfigured(),
  });
}
