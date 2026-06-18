import { NextResponse } from "next/server";
import {
  mapPractitionerRow,
  SALARIE_PRACTITIONERS_FALLBACK,
  type SalariePractitionerRow,
} from "@/lib/learner/practitioners";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Praticiens EDGE visibles dans Mes coachings (salarié / apprenant). */
export async function GET() {
  const authClient = await createSupabaseServerClient();
  if (!authClient) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const db = getServiceRoleClient() ?? authClient;
  const { data, error } = await db
    .from("praticiens_bct")
    .select("id, prenom, nom, photo_url, titre, biographie, specialites")
    .eq("status", "active")
    .eq("visible_salarie_coaching", true)
    .order("nom", { ascending: true });

  if (error) {
    return NextResponse.json({
      praticiens: SALARIE_PRACTITIONERS_FALLBACK,
      source: "fallback",
    });
  }

  const rows = (data ?? []) as SalariePractitionerRow[];
  const praticiens =
    rows.length > 0 ? rows.map(mapPractitionerRow) : SALARIE_PRACTITIONERS_FALLBACK;

  return NextResponse.json({ praticiens, source: rows.length > 0 ? "database" : "fallback" });
}
