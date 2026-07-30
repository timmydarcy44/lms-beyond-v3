import { NextRequest, NextResponse } from "next/server";
import { requirePipelinePrescripteurAccess } from "@/lib/crm/pipeline-prescripteur-access.server";
import { isPrescripteurActionType } from "@/lib/crm/pipeline-prescripteur-action-types";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await requirePipelinePrescripteurAccess())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("crm_pipeline_prescripteur_actions")
    .select("*")
    .eq("prescripteur_id", id)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ actions: data ?? [] });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const access = await requirePipelinePrescripteurAccess();
  if (!access) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id: prescripteurId } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action_type = String(body?.action_type ?? "note").trim();
  if (!isPrescripteurActionType(action_type)) {
    return NextResponse.json({ error: "Type d'action invalide" }, { status: 400 });
  }
  const notes = body?.notes ? String(body.notes).trim() : null;
  const title = body?.title ? String(body.title).trim() : null;
  const created_by_email = body?.created_by_email
    ? String(body.created_by_email).trim()
    : access.email;

  const { data: existing } = await supabase
    .from("crm_pipeline_prescripteurs")
    .select("id")
    .eq("id", prescripteurId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Prescripteur introuvable" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("crm_pipeline_prescripteur_actions")
    .insert({
      prescripteur_id: prescripteurId,
      action_type,
      title,
      notes,
      created_by_email,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase
    .from("crm_pipeline_prescripteurs")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", prescripteurId);

  return NextResponse.json({ action: data });
}
