import { NextRequest, NextResponse } from "next/server";
import { assertMarketplaceAccess } from "@/lib/marketplace/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await assertMarketplaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error, tier: access.tier }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const specialite = searchParams.get("specialite");
  const langue = searchParams.get("langue");

  let query = service
    .from("praticiens_bct")
    .select(
      "id, prenom, nom, photo_url, titre, specialites, langues, tarif_session, duree_session, bct_certified, note_moyenne, nombre_avis",
    )
    .eq("status", "active")
    .eq("visible_marketplace", true)
    .eq("bct_certified", true);

  const { data, error } = await query.order("nom", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let items = data ?? [];
  if (specialite) {
    items = items.filter((p) => (p.specialites as string[] | null)?.includes(specialite));
  }
  if (langue) {
    items = items.filter((p) => (p.langues as string[] | null)?.includes(langue));
  }

  return NextResponse.json({ praticiens: items, tier: access.tier });
}
