import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { openBadgeRowToBadgeClass } from "@/lib/openbadges/open-badges-table-store";

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
    .from("open_badges")
    .select("id,name,title,description,image_url,status,org_id,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const badges = (data ?? []).map((row) => {
    const mapped = openBadgeRowToBadgeClass(row as Record<string, unknown>);
    return {
      id: String(mapped.id),
      name: String(mapped.name ?? ""),
      description: String(mapped.description ?? ""),
      imageUrl: (mapped.imageUrl as string | null) ?? null,
      status: String(mapped.status ?? "DRAFT"),
    };
  });

  return NextResponse.json({ badges });
}
