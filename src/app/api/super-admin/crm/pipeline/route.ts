import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  DEFAULT_BTOC_PIPELINE_STAGES,
  DEFAULT_PIPELINE_STAGES,
  type PipelineType,
} from "@/lib/crm/pipeline-shared";
import { syncBtocPipelineDeals } from "@/lib/crm/btoc-pipeline-sync";

async function ensureStages(
  supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  pipelineType: PipelineType,
) {
  const stages = pipelineType === "btoc" ? DEFAULT_BTOC_PIPELINE_STAGES : DEFAULT_PIPELINE_STAGES;
  for (const stage of stages) {
    await supabase.from("crm_pipeline_stages").upsert(
      {
        pipeline_type: pipelineType,
        slug: stage.slug,
        label: stage.label,
        sort_order: stage.sort_order,
      },
      { onConflict: "pipeline_type,slug" },
    );
  }
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const pipelineType = (req.nextUrl.searchParams.get("type") === "btoc" ? "btoc" : "btob") as PipelineType;
  const doSync = req.nextUrl.searchParams.get("sync") === "1";

  if (pipelineType === "btoc" && doSync) {
    await syncBtocPipelineDeals();
  }

  await ensureStages(supabase, pipelineType);

  const [{ data: stages, error: stagesError }, { data: deals, error: dealsError }] = await Promise.all([
    supabase
      .from("crm_pipeline_stages")
      .select("*")
      .eq("pipeline_type", pipelineType)
      .order("sort_order", { ascending: true }),
    supabase
      .from("crm_pipeline_deals")
      .select("*")
      .eq("pipeline_type", pipelineType)
      .order("sort_order", { ascending: true }),
  ]);

  if (stagesError) return NextResponse.json({ error: stagesError.message }, { status: 400 });
  if (dealsError) return NextResponse.json({ error: dealsError.message }, { status: 400 });

  return NextResponse.json({ pipelineType, stages: stages ?? [], deals: deals ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const pipeline_type = (body?.pipeline_type === "btoc" ? "btoc" : "btob") as PipelineType;
  const stage_slug = String(body?.stage_slug ?? (pipeline_type === "btoc" ? "inscription" : "a_appeler")).trim();
  const company_name = String(body?.company_name ?? "").trim();
  const contact_first_name = String(body?.contact_first_name ?? "").trim();

  if (!company_name) {
    return NextResponse.json({ error: "Nom de l'entreprise requis" }, { status: 400 });
  }

  const { data: maxOrder } = await supabase
    .from("crm_pipeline_deals")
    .select("sort_order")
    .eq("pipeline_type", pipeline_type)
    .eq("stage_slug", stage_slug)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const amountRaw = body?.amount_cents ?? body?.amount;
  let amount_cents = 0;
  if (typeof amountRaw === "number") amount_cents = Math.round(amountRaw);
  else if (typeof amountRaw === "string" && amountRaw.trim()) {
    const parsed = Number.parseFloat(amountRaw.replace(",", "."));
    amount_cents = Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
  }

  const { data, error } = await supabase
    .from("crm_pipeline_deals")
    .insert({
      pipeline_type,
      stage_slug,
      company_name,
      contact_first_name,
      email: body?.email ? String(body.email).trim() : null,
      phone: body?.phone ? String(body.phone).trim() : null,
      amount_cents,
      notes: body?.notes ? String(body.notes).trim() : null,
      source: "manual",
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ deal: data });
}
