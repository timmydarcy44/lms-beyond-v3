import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const EXPERT_SELECT =
  "id,first_name,last_name,headline,photo_url,avatar_url,review_status,is_active";

export async function GET() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("experts")
    .select(EXPERT_SELECT)
    .eq("review_status", "approved")
    .eq("is_active", true)
    .order("last_name", { ascending: true })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const experts = (data ?? []).map((row) => ({
    id: row.id,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    headline: row.headline ?? null,
    photo_url: row.photo_url ?? row.avatar_url ?? null,
  }));

  return NextResponse.json({ experts });
}
