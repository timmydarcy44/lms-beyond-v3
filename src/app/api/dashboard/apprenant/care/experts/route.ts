import { NextResponse } from "next/server";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type CareExpertListItem = {
  id: string;
  firstName: string;
  lastName: string;
  headline: string | null;
  photoUrl: string | null;
  specialties: string[];
};

/** Experts Care cochés dans /super (is_care_expert). */
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
    .from("experts")
    .select("id,first_name,last_name,headline,photo_url,avatar_url,specialties")
    .eq("is_care_expert", true)
    .eq("is_active", true)
    .eq("review_status", "approved")
    .order("last_name", { ascending: true });

  if (error) {
    // Colonne absente tant que la migration n'est pas appliquée → liste vide, pas d'erreur UI
    console.warn("[care/experts]", error.message);
    return NextResponse.json({ experts: [] as CareExpertListItem[], source: "unavailable" });
  }

  const experts: CareExpertListItem[] = (data ?? []).map((row) => ({
    id: String(row.id),
    firstName: String(row.first_name ?? "").trim(),
    lastName: String(row.last_name ?? "").trim(),
    headline: row.headline ? String(row.headline) : null,
    photoUrl: (row.photo_url || row.avatar_url) ? String(row.photo_url || row.avatar_url) : null,
    specialties: Array.isArray(row.specialties) ? row.specialties.map(String) : [],
  }));

  return NextResponse.json({ experts, source: "database" });
}
