import { NextRequest, NextResponse } from "next/server";

import { requirePipelinePrescripteurAccess } from "@/lib/crm/pipeline-prescripteur-access.server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  isValidPipelineOwnerEmail,
} from "@/lib/crm/pipeline-btob-owners";

export async function GET() {
  if (!(await requirePipelinePrescripteurAccess())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("crm_pipeline_prescripteurs")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ prescripteurs: [], warning: "table_missing" });
    }
    console.error("[prescripteurs GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prescripteurs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const access = await requirePipelinePrescripteurAccess();
  if (!access) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const first_name = String(body.first_name ?? "").trim();
  const last_name = String(body.last_name ?? "").trim();
  const company_name = String(body.company_name ?? "").trim();

  if (!first_name || !last_name || !company_name) {
    return NextResponse.json(
      { error: "Prénom, nom et entreprise sont requis." },
      { status: 400 },
    );
  }

  const ownerRaw = String(body.contact_owner_email ?? access.email).trim().toLowerCase();
  const contact_owner_email = isValidPipelineOwnerEmail(ownerRaw)
    ? ownerRaw
    : DEFAULT_PIPELINE_BTOB_OWNER_EMAIL;

  const row = {
    first_name,
    last_name,
    company_name,
    email: String(body.email ?? "").trim() || null,
    phone: String(body.phone ?? "").trim() || null,
    next_action: String(body.next_action ?? "").trim(),
    notes: String(body.notes ?? "").trim() || null,
    contact_owner_email,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("crm_pipeline_prescripteurs")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    console.error("[prescripteurs POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prescripteur: data });
}
