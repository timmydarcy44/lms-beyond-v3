import { NextRequest, NextResponse } from "next/server";
import { ensureDisabilityAccommodationRequest } from "@/lib/handicap/create-request";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Demande d'aménagement depuis l'espace apprenant (profil connecté).
 * Corps : { needs_text?: string, accommodation_needed: true }
 */
export async function POST(req: NextRequest) {
  const client = await getServerClient();
  const {
    data: { user },
  } = client ? await client.auth.getUser() : { data: { user: null } };
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    accommodation_needed?: boolean;
    needs_text?: string | null;
  } | null;

  if (!body?.accommodation_needed) {
    return NextResponse.json({ error: "accommodation_needed requis" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: profile } = await service
    .from("profiles")
    .select("id, email, reference_email")
    .eq("id", user.id)
    .maybeSingle();

  const email =
    String(profile?.email ?? "").trim() ||
    String(profile?.reference_email ?? "").trim() ||
    user.email ||
    null;

  const result = await ensureDisabilityAccommodationRequest(service, {
    scope: "business",
    personProfileId: user.id,
    needsText: body.needs_text,
    personEmail: email,
  });

  if (!result) {
    return NextResponse.json({ error: "Création impossible" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    caseId: result.caseId,
    created: result.created,
  });
}
