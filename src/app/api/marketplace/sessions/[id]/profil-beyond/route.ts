import { NextResponse } from "next/server";
import { assertPraticienAccess } from "@/lib/marketplace/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Données cognitives Beyond — uniquement si consentement explicite du collaborateur. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await assertPraticienAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { id: sessionId } = await context.params;
  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: session, error } = await service
    .from("sessions_bct")
    .select("id, praticien_id, collaborateur_id, consentement_donnees")
    .eq("id", sessionId)
    .eq("praticien_id", access.praticienId)
    .maybeSingle();

  if (error || !session) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  if (!session.consentement_donnees) {
    return NextResponse.json(
      { error: "Le collaborateur n'a pas autorisé le partage de son profil Beyond" },
      { status: 403 },
    );
  }

  const { data: profile } = await service
    .from("profiles")
    .select("id, first_name, last_name, full_name")
    .eq("id", session.collaborateur_id)
    .maybeSingle();

  const { data: diagnostic } = await service
    .from("collaborateur_diagnostics")
    .select("disc_profil, idmc_score, stress_score, soft_skills_gaps, completed_at")
    .eq("collaborateur_id", session.collaborateur_id)
    .eq("actif", true)
    .maybeSingle();

  return NextResponse.json({
    collaborateur: profile,
    profilBeyond: diagnostic ?? null,
  });
}
