import { NextResponse } from "next/server";
import { assertMarketplaceAccess } from "@/lib/marketplace/auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await assertMarketplaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error, tier: access.tier }, { status: 403 });
  }

  const { id } = await context.params;
  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await service
    .from("praticiens_bct")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .eq("visible_marketplace", true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Praticien introuvable" }, { status: 404 });
  }

  return NextResponse.json({ praticien: data });
}
