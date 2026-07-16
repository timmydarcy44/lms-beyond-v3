import { NextRequest, NextResponse } from "next/server";

import { requirePipelinePrescripteurAccess } from "@/lib/crm/pipeline-prescripteur-access.server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  isValidPipelineOwnerEmail,
} from "@/lib/crm/pipeline-btob-owners";
import {
  parseInterlocutorsPayload,
  replacePrescripteurInterlocutors,
} from "@/lib/crm/prescripteur-interlocutors";

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

  const interlocutors = parseInterlocutorsPayload(body.interlocutors);
  const primary = interlocutors[0];
  const first_name = String(body.first_name ?? primary?.first_name ?? "").trim();
  const last_name = String(body.last_name ?? primary?.last_name ?? "").trim();
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
    email: String(body.email ?? primary?.email ?? "").trim() || null,
    phone: String(body.phone ?? primary?.phone ?? "").trim() || null,
    link_url: String(body.link_url ?? "").trim() || null,
    cta_label: String(body.cta_label ?? "").trim() || null,
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
    // Fallback if link columns not migrated yet
    if (error.message?.includes("link_url") || error.message?.includes("cta_label")) {
      const { link_url: _l, cta_label: _c, ...legacy } = row;
      const retry = await supabase.from("crm_pipeline_prescripteurs").insert(legacy).select("*").single();
      if (retry.error) {
        console.error("[prescripteurs POST]", retry.error);
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      if (interlocutors.length && retry.data?.id) {
        await replacePrescripteurInterlocutors(supabase, retry.data.id, interlocutors);
      }
      return NextResponse.json({ prescripteur: retry.data });
    }
    console.error("[prescripteurs POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (interlocutors.length && data?.id) {
    const sync = await replacePrescripteurInterlocutors(supabase, data.id, interlocutors);
    if (sync.error) {
      console.error("[prescripteurs POST interlocutors]", sync.error);
    }
  }

  return NextResponse.json({
    prescripteur: {
      ...data,
      interlocutors,
    },
  });
}
