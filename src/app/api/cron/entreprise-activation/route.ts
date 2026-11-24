import { NextRequest, NextResponse } from "next/server";
import { runEntrepriseActivationEmails } from "@/lib/entreprise/activation-emails";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = getServiceRoleClient();
  if (!db) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const orgId = request.nextUrl.searchParams.get("orgId")?.trim() || undefined;
  const stats = await runEntrepriseActivationEmails(db, { orgId });
  return NextResponse.json({ ok: true, ...stats });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
