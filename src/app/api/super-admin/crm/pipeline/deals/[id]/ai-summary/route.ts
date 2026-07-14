import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { synthesizeProspectOverview } from "@/lib/crm/pipeline-ai-synthesis";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: dealId } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: deal, error: dealError } = await supabase
    .from("crm_pipeline_deals")
    .select("*")
    .eq("id", dealId)
    .maybeSingle();

  if (dealError) return NextResponse.json({ error: dealError.message }, { status: 400 });
  if (!deal) return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });

  const { data: actions } = await supabase
    .from("crm_pipeline_deal_actions")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(30);

  const summary = await synthesizeProspectOverview({
    deal,
    actions: actions ?? [],
    existingSummary: deal.ai_prospect_summary,
  });

  if (!summary) {
    return NextResponse.json({ error: "Synthèse IA indisponible" }, { status: 503 });
  }

  const now = new Date().toISOString();
  await supabase
    .from("crm_pipeline_deals")
    .update({ ai_prospect_summary: summary, ai_prospect_summary_at: now, updated_at: now })
    .eq("id", dealId);

  return NextResponse.json({ summary, generated_at: now });
}
