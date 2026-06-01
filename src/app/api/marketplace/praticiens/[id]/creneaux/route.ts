import { NextRequest, NextResponse } from "next/server";
import { assertMarketplaceAccess } from "@/lib/marketplace/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await assertMarketplaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const { id: praticienId } = await context.params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = searchParams.get("to");

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  let query = service
    .from("praticien_creneaux")
    .select("id, date, heure_debut, heure_fin, disponible")
    .eq("praticien_id", praticienId)
    .eq("disponible", true)
    .gte("date", from)
    .order("date")
    .order("heure_debut");

  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ creneaux: data ?? [] });
}
