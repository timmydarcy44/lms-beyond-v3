import { NextRequest, NextResponse } from "next/server";
import { verifyEntrepriseCode } from "@/lib/entreprise/signup-code";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const token = String(body?.token ?? "").replace(/\s/g, "");
  if (!email.includes("@") || !/^\d{6,10}$/.test(token)) {
    return NextResponse.json({ error: "Code incorrect ou expiré." }, { status: 400 });
  }

  const sessionClient = await getServerClient();
  const db = getServiceRoleClient();
  if (!sessionClient || !db) {
    return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
  }

  const result = await verifyEntrepriseCode(sessionClient, db, email, token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ step: "done", destination: result.destination });
}
