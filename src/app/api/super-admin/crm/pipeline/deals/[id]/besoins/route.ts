import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  NEED_ANALYSIS_SELECT,
  isNeedAnalysisComplete,
  mapNeedAnalysisRow,
  normalizeRecommendations,
} from "@/lib/control/need-analyses";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireStaff() {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) return null;
  return { service: getServiceRoleClient(), userId: data.user.id };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const { data: deal, error: dealError } = await auth.service
    .from("crm_pipeline_deals")
    .select("id, company_name, organization_id, stage_slug")
    .eq("id", dealId)
    .maybeSingle();

  if (dealError) return NextResponse.json({ error: dealError.message }, { status: 500 });
  if (!deal) return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });

  const orgId = deal.organization_id ? String(deal.organization_id) : null;

  if (orgId) {
    await auth.service
      .from("organization_need_analyses")
      .update({ organization_id: orgId, updated_at: new Date().toISOString() })
      .eq("deal_id", dealId)
      .is("organization_id", null);
  }

  let query = auth.service
    .from("organization_need_analyses")
    .select(NEED_ANALYSIS_SELECT)
    .order("updated_at", { ascending: false });

  if (orgId) {
    query = query.or(`deal_id.eq.${dealId},organization_id.eq.${orgId}`);
  } else {
    query = query.eq("deal_id", dealId);
  }

  const { data, error } = await query;

  if (error) {
    if (/organization_need_analyses|schema cache|does not exist/i.test(error.message)) {
      return NextResponse.json({
        analyses: [],
        deals: [
          {
            id: dealId,
            label: String(deal.company_name || "Deal").trim() || "Deal",
            stage: deal.stage_slug ? String(deal.stage_slug) : null,
          },
        ],
        organizationId: orgId,
        error:
          "Migration besoins non appliquée. Appliquez supabase/migrations/20261121140000_organization_need_analyses.sql",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    analyses: (data ?? []).map((row) => mapNeedAnalysisRow(row as Record<string, unknown>)),
    deals: [
      {
        id: dealId,
        label: String(deal.company_name || "Deal").trim() || "Deal",
        stage: deal.stage_slug ? String(deal.stage_slug) : null,
      },
    ],
    organizationId: orgId,
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const { data: deal, error: dealError } = await auth.service
    .from("crm_pipeline_deals")
    .select("id, organization_id, company_name")
    .eq("id", dealId)
    .maybeSingle();

  if (dealError) return NextResponse.json({ error: dealError.message }, { status: 500 });
  if (!deal) return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title =
    String(body.title ?? "").trim() ||
    `Analyse — ${String(deal.company_name || "entreprise").trim()}`;
  const context_problem = String(body.context_problem ?? "").trim();
  const expected_outcomes = String(body.expected_outcomes ?? "").trim();
  const audience = String(body.audience ?? "").trim();
  const constraints = String(body.constraints ?? "").trim();
  const disability_accommodations = String(body.disability_accommodations ?? "").trim();
  const decided_adaptations = String(body.decided_adaptations ?? "").trim();
  const recommendations = normalizeRecommendations(body.recommendations);
  const wantComplete = body.markComplete === true;
  const complete =
    wantComplete &&
    isNeedAnalysisComplete({
      context_problem,
      expected_outcomes,
      audience,
      constraints,
      disability_accommodations,
      decided_adaptations,
    });

  if (wantComplete && !complete) {
    return NextResponse.json(
      { error: "Pour marquer l’analyse complète, renseignez les 6 blocs principaux." },
      { status: 400 },
    );
  }

  const orgId = deal.organization_id ? String(deal.organization_id) : null;
  const payload = {
    organization_id: orgId,
    deal_id: dealId,
    title,
    context_problem,
    expected_outcomes,
    audience,
    constraints,
    disability_accommodations,
    decided_adaptations,
    recommendations,
    status: complete ? "complete" : "draft",
    completed_at: complete ? new Date().toISOString() : null,
    created_by: auth.userId,
    updated_by: auth.userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await auth.service
    .from("organization_need_analyses")
    .insert(payload)
    .select(NEED_ANALYSIS_SELECT)
    .single();

  if (error) {
    if (/organization_need_analyses|schema cache|does not exist/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "Migration besoins non appliquée. Appliquez supabase/migrations/20261121140000_organization_need_analyses.sql",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ analysis: mapNeedAnalysisRow(data as Record<string, unknown>) });
}
