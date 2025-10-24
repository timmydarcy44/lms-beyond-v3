export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  // Test volontaire pour Sentry - ne jamais utiliser en production normale
  throw new Error("BOOM_TEST - Sentry error test");
}
