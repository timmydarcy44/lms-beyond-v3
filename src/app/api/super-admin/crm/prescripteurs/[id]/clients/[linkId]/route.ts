import { NextRequest, NextResponse } from "next/server";

import { requirePipelinePrescripteurAccess } from "@/lib/crm/pipeline-prescripteur-access.server";
import type { CommissionType } from "@/lib/crm/pipeline-prescripteur-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string; linkId: string }> };

function parseCommissionType(raw: unknown): CommissionType | null {
  if (raw === "percent" || raw === "fixed") return raw;
  return null;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (!(await requirePipelinePrescripteurAccess())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: prescripteurId, linkId } = await context.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body?.commission_type != null) {
    const type = parseCommissionType(body.commission_type);
    if (!type) return NextResponse.json({ error: "Type de commission invalide" }, { status: 400 });
    patch.commission_type = type;
  }

  if (body?.commission_value != null) {
    const value = Number(body.commission_value);
    const type =
      parseCommissionType(body.commission_type) ??
      (await supabase
        .from("crm_pipeline_prescripteur_clients")
        .select("commission_type")
        .eq("id", linkId)
        .maybeSingle()).data?.commission_type;

    if (type === "percent" && (value < 0 || value > 100)) {
      return NextResponse.json({ error: "Le pourcentage doit être entre 0 et 100" }, { status: 400 });
    }
    if (type === "fixed" && value < 0) {
      return NextResponse.json({ error: "Le montant fixe doit être positif" }, { status: 400 });
    }
    patch.commission_value = value;
  }

  if (body?.notes !== undefined) {
    patch.notes = body.notes != null ? String(body.notes).trim() || null : null;
  }

  const { data, error } = await supabase
    .from("crm_pipeline_prescripteur_clients")
    .update(patch)
    .eq("id", linkId)
    .eq("prescripteur_id", prescripteurId)
    .select(
      `
      id,
      prescripteur_id,
      deal_id,
      commission_type,
      commission_value,
      notes,
      created_at,
      updated_at,
      deal:crm_pipeline_deals (
        id,
        company_name,
        contact_first_name,
        contact_last_name,
        email,
        stage_slug,
        amount_cents
      )
    `,
    )
    .single();

  if (error) {
    console.error("[prescripteur client PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link: data });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  if (!(await requirePipelinePrescripteurAccess())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: prescripteurId, linkId } = await context.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { error } = await supabase
    .from("crm_pipeline_prescripteur_clients")
    .delete()
    .eq("id", linkId)
    .eq("prescripteur_id", prescripteurId);

  if (error) {
    console.error("[prescripteur client DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
