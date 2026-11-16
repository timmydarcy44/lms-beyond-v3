import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const BUCKET = "qualiopi-procedures";

/** URL signée du PDF de la version en vigueur (ou version=?). */
export async function GET(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;
  const version = req.nextUrl.searchParams.get("version");

  const { data: proc } = await supabase
    .from("crm_qualiopi_procedures")
    .select("id, current_version")
    .eq("id", id)
    .maybeSingle();
  if (!proc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let q = supabase
    .from("crm_qualiopi_procedure_versions")
    .select("*")
    .eq("procedure_id", id)
    .order("validated_at", { ascending: false })
    .limit(1);
  if (version) q = q.eq("version", version);

  const { data: ver, error } = await q.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!ver?.pdf_path) {
    return NextResponse.json({ error: "Aucun PDF pour cette version" }, { status: 404 });
  }

  const signed = await supabase.storage.from(BUCKET).createSignedUrl(ver.pdf_path, 60 * 30);
  if (signed.error || !signed.data?.signedUrl) {
    return NextResponse.json({ error: signed.error?.message || "URL signée impossible" }, { status: 502 });
  }
  return NextResponse.json({ url: signed.data.signedUrl, version: ver.version });
}
