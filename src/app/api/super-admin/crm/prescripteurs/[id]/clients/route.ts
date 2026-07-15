import { NextRequest, NextResponse } from "next/server";

import { requirePipelinePrescripteurAccess } from "@/lib/crm/pipeline-prescripteur-access.server";
import type { CommissionType } from "@/lib/crm/pipeline-prescripteur-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

function parseCommissionType(raw: unknown): CommissionType {
  return raw === "fixed" ? "fixed" : "percent";
}

export async function POST(req: NextRequest, context: RouteContext) {
  if (!(await requirePipelinePrescripteurAccess())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: prescripteurId } = await context.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const dealId = String(body?.deal_id ?? "").trim();
  if (!dealId) {
    return NextResponse.json({ error: "Prospect requis" }, { status: 400 });
  }

  const commission_type = parseCommissionType(body?.commission_type);
  const commission_value = Number(body?.commission_value ?? 0);
  if (commission_type === "percent" && (commission_value < 0 || commission_value > 100)) {
    return NextResponse.json({ error: "Le pourcentage doit être entre 0 et 100" }, { status: 400 });
  }
  if (commission_type === "fixed" && commission_value < 0) {
    return NextResponse.json({ error: "Le montant fixe doit être positif" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("crm_pipeline_prescripteur_clients")
    .insert({
      prescripteur_id: prescripteurId,
      deal_id: dealId,
      commission_type,
      commission_value,
      notes: body?.notes != null ? String(body.notes).trim() || null : null,
      updated_at: now,
    })
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
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce prospect est déjà lié à ce prescripteur" }, { status: 400 });
    }
    if (error.code === "42P01") {
      return NextResponse.json(
        { error: "Table prescripteur_clients absente — appliquez la migration Supabase" },
        { status: 503 },
      );
    }
    console.error("[prescripteur clients POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link: data });
}
