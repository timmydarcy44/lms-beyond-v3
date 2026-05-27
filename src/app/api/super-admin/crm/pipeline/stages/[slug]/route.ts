import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ slug: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { slug } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { label?: string } | null;
  const label = body?.label?.trim();
  if (!label) {
    return NextResponse.json({ error: "label requis" }, { status: 400 });
  }

  const pipeline_type =
    req.nextUrl.searchParams.get("type") === "btoc" ? "btoc" : "btob";

  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .update({ label, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .eq("pipeline_type", pipeline_type)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ stage: data });
}
