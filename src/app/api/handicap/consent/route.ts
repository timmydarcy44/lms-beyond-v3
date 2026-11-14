import { NextRequest, NextResponse } from "next/server";
import { writeDisabilityAccessLog } from "@/lib/handicap/access-log";
import { verifyDisabilityConsentToken } from "@/lib/handicap/consent-token";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Confirme le consentement via le lien e-mail (JWT). */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = String(body?.token ?? "").trim();
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const verified = await verifyDisabilityConsentToken(token);
  if (!verified) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: row, error: readErr } = await service
    .from("disability_cases")
    .select("id, consent_given_at, status")
    .eq("id", verified.caseId)
    .maybeSingle();
  if (readErr || !row?.id) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  if (row.consent_given_at) {
    return NextResponse.json({ ok: true, already: true });
  }

  const { error } = await service
    .from("disability_cases")
    .update({
      consent_given_at: new Date().toISOString(),
      consent_method: "email",
      updated_at: new Date().toISOString(),
    })
    .eq("id", verified.caseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await writeDisabilityAccessLog(service, {
    caseId: verified.caseId,
    actorId: null,
    action: "view_case",
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get("token") ?? "").trim();
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  const verified = await verifyDisabilityConsentToken(token);
  if (!verified) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { data } = await service
    .from("disability_cases")
    .select("id, consent_given_at")
    .eq("id", verified.caseId)
    .maybeSingle();
  if (!data?.id) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    consented: Boolean(data.consent_given_at),
  });
}
