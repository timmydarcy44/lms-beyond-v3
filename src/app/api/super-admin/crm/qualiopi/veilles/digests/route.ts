import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("crm_qualiopi_veille_digests")
    .select("*")
    .order("week_start", { ascending: false })
    .order("kind")
    .limit(24);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ digests: data ?? [] });
}
