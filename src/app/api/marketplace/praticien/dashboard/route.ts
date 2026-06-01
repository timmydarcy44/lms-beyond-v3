import { NextResponse } from "next/server";
import { formatEurosFromCents } from "@/lib/marketplace/commission";
import { assertPraticienAccess } from "@/lib/marketplace/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await assertPraticienAccess();
  if (!access.ok || !access.praticienId) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const [{ data: praticien }, { data: sessions }] = await Promise.all([
    service.from("praticiens_bct").select("*").eq("id", access.praticienId).single(),
    service
      .from("sessions_bct")
      .select(
        "id, date_session, heure_debut, duree_minutes, status, payment_status, consentement_donnees, montant_praticien, collaborateur_id",
      )
      .eq("praticien_id", access.praticienId)
      .in("payment_status", ["paid", "pending"])
      .gte("date_session", monthStart)
      .order("date_session")
      .order("heure_debut"),
  ]);

  const paid = sessions ?? [];
  const collabIds = [...new Set(paid.map((s) => s.collaborateur_id as string))];
  const { data: profiles } =
    collabIds.length > 0
      ? await service.from("profiles").select("id, first_name, full_name").in("id", collabIds)
      : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const upcoming = paid
    .filter((s) => s.status === "confirmee" && String(s.date_session) >= now.toISOString().slice(0, 10))
    .map((s) => ({
      ...s,
      profiles: profileById.get(s.collaborateur_id as string) ?? null,
    }));

  const revenusCents = paid
    .filter((s) => s.payment_status === "paid")
    .reduce((sum, s) => sum + Number(s.montant_praticien ?? 0), 0);

  return NextResponse.json({
    praticien,
    stats: {
      sessionsMois: paid.filter((s) => s.payment_status === "paid").length,
      aVenir: upcoming.length,
      revenusMois: formatEurosFromCents(revenusCents),
      revenusMoisCents: revenusCents,
    },
    prochainesSessions: upcoming.slice(0, 10),
  });
}
