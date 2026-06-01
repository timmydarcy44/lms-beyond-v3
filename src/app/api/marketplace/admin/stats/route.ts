import { NextResponse } from "next/server";
import { formatEurosFromCents } from "@/lib/marketplace/commission";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [{ count: praticiensActifs }, { data: sessions }] = await Promise.all([
    service
      .from("praticiens_bct")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("visible_marketplace", true),
    service
      .from("sessions_bct")
      .select("id, montant_total, commission_beyond, montant_praticien, praticien_id, praticiens_bct ( prenom, nom )")
      .eq("payment_status", "paid")
      .gte("date_session", monthStart),
  ]);

  const rows = sessions ?? [];
  const commissionCents = rows.reduce((s, r) => s + Number(r.commission_beyond ?? 0), 0);

  const byPraticien = new Map<
    string,
    { prenom: string; nom: string; sessions: number; brut: number; net: number }
  >();

  for (const row of rows) {
    const pid = row.praticien_id as string;
    const pRaw = row.praticiens_bct as { prenom: string; nom: string } | { prenom: string; nom: string }[] | null;
    const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    const cur = byPraticien.get(pid) ?? {
      prenom: p?.prenom ?? "",
      nom: p?.nom ?? "",
      sessions: 0,
      brut: 0,
      net: 0,
    };
    cur.sessions += 1;
    cur.brut += Number(row.montant_total ?? 0);
    cur.net += Number(row.montant_praticien ?? 0);
    byPraticien.set(pid, cur);
  }

  return NextResponse.json({
    praticiensActifs: praticiensActifs ?? 0,
    sessionsMois: rows.length,
    commissionMois: formatEurosFromCents(commissionCents),
    commissionMoisCents: commissionCents,
    praticiens: Array.from(byPraticien.entries()).map(([id, v]) => ({
      id,
      ...v,
      brutLabel: formatEurosFromCents(v.brut),
      netLabel: formatEurosFromCents(v.net),
    })),
  });
}
