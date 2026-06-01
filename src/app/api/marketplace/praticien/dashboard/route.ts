import { NextRequest, NextResponse } from "next/server";
import { formatEurosFromCents } from "@/lib/marketplace/commission";
import { assertPraticienAccess } from "@/lib/marketplace/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function monthBounds(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export async function GET(request: NextRequest) {
  const access = await assertPraticienAccess();
  if (!access.ok || !access.praticienId) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const month = Number(searchParams.get("month") ?? now.getMonth());
  const { from: monthFrom, to: monthTo } = monthBounds(year, month);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const [{ data: praticien }, { data: sessionsMonth }, { data: upcomingAll }, { data: pastPaid }, { data: creneaux }] =
    await Promise.all([
      service.from("praticiens_bct").select("*").eq("id", access.praticienId).single(),
      service
        .from("sessions_bct")
        .select("id, payment_status, montant_praticien, status, date_session")
        .eq("praticien_id", access.praticienId)
        .gte("date_session", monthStart),
      service
        .from("sessions_bct")
        .select(
          "id, date_session, heure_debut, duree_minutes, status, payment_status, consentement_donnees, collaborateur_id",
        )
        .eq("praticien_id", access.praticienId)
        .eq("status", "confirmee")
        .gte("date_session", today)
        .order("date_session")
        .order("heure_debut"),
      service
        .from("sessions_bct")
        .select("id, date_session, heure_debut, montant_praticien, payment_status")
        .eq("praticien_id", access.praticienId)
        .eq("payment_status", "paid")
        .lt("date_session", today)
        .order("date_session", { ascending: false })
        .limit(20),
      service
        .from("praticien_creneaux")
        .select("id, date, heure_debut, heure_fin, disponible")
        .eq("praticien_id", access.praticienId)
        .gte("date", monthFrom)
        .lte("date", monthTo)
        .order("date")
        .order("heure_debut"),
    ]);

  const paidMonth = (sessionsMonth ?? []).filter((s) => s.payment_status === "paid");
  const revenusCents = paidMonth.reduce((sum, s) => sum + Number(s.montant_praticien ?? 0), 0);

  const collabIds = [...new Set((upcomingAll ?? []).map((s) => s.collaborateur_id as string))];
  const { data: profiles } =
    collabIds.length > 0
      ? await service.from("profiles").select("id, first_name, full_name").in("id", collabIds)
      : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const prochainesSessions = (upcomingAll ?? []).map((s) => ({
    ...s,
    profiles: profileById.get(s.collaborateur_id as string) ?? null,
  }));

  const noteMoyenne = Number(praticien?.note_moyenne ?? 0);
  const nombreAvis = Number(praticien?.nombre_avis ?? 0);

  return NextResponse.json({
    praticien,
    stats: {
      sessionsMois: paidMonth.length,
      aVenir: prochainesSessions.length,
      revenusMois: formatEurosFromCents(revenusCents),
      revenusMoisCents: revenusCents,
      noteMoyenne: noteMoyenne > 0 ? noteMoyenne : null,
      nombreAvis,
    },
    prochainesSessions,
    sessionsPassees: (pastPaid ?? []).map((s) => ({
      ...s,
      montantLabel: formatEurosFromCents(Number(s.montant_praticien ?? 0)),
    })),
    creneaux: creneaux ?? [],
    calendar: { year, month, from: monthFrom, to: monthTo },
  });
}
