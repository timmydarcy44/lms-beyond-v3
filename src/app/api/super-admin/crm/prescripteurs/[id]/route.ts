import { NextRequest, NextResponse } from "next/server";

import { requirePipelinePrescripteurAccess } from "@/lib/crm/pipeline-prescripteur-access.server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  isValidPipelineOwnerEmail,
} from "@/lib/crm/pipeline-btob-owners";

type RouteContext = { params: Promise<{ id: string }> };

async function fetchPrescripteurWithClients(supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>, id: string) {
  const { data: prescripteur, error } = await supabase
    .from("crm_pipeline_prescripteurs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!prescripteur) return null;

  const { data: links, error: linksError } = await supabase
    .from("crm_pipeline_prescripteur_clients")
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
    .eq("prescripteur_id", id)
    .order("created_at", { ascending: false });

  if (linksError && linksError.code !== "42P01") throw linksError;

  return {
    prescripteur,
    linked_clients: links ?? [],
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  if (!(await requirePipelinePrescripteurAccess())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const result = await fetchPrescripteurWithClients(supabase, id);
    if (!result) {
      return NextResponse.json({ error: "Prescripteur introuvable" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[prescripteurs GET id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (!(await requirePipelinePrescripteurAccess())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.first_name != null) patch.first_name = String(body.first_name).trim();
  if (body.last_name != null) patch.last_name = String(body.last_name).trim();
  if (body.company_name != null) patch.company_name = String(body.company_name).trim();
  if (body.email != null) patch.email = String(body.email).trim() || null;
  if (body.phone != null) patch.phone = String(body.phone).trim() || null;
  if (body.next_action != null) patch.next_action = String(body.next_action).trim();
  if (body.notes != null) patch.notes = String(body.notes).trim() || null;

  if (body.contact_owner_email != null) {
    const ownerRaw = String(body.contact_owner_email).trim().toLowerCase();
    patch.contact_owner_email = isValidPipelineOwnerEmail(ownerRaw)
      ? ownerRaw
      : DEFAULT_PIPELINE_BTOB_OWNER_EMAIL;
  }

  const { data, error } = await supabase
    .from("crm_pipeline_prescripteurs")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[prescripteurs PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prescripteur: data });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  if (!(await requirePipelinePrescripteurAccess())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { error } = await supabase.from("crm_pipeline_prescripteurs").delete().eq("id", id);

  if (error) {
    console.error("[prescripteurs DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
