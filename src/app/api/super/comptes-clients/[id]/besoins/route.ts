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
  const { id: orgId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const dealsRes = await auth.service
    .from("crm_pipeline_deals")
    .select("id, company_name, stage_slug, updated_at")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(40);

  const deals = (dealsRes.error ? [] : dealsRes.data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.company_name || "Deal").trim() || "Deal",
    stage: row.stage_slug ? String(row.stage_slug) : null,
  }));
  const dealIds = deals.map((d) => d.id);

  // Rattacher les analyses créées sur le deal avant le compte client.
  if (dealIds.length) {
    await auth.service
      .from("organization_need_analyses")
      .update({ organization_id: orgId, updated_at: new Date().toISOString() })
      .in("deal_id", dealIds)
      .is("organization_id", null);
  }

  let query = auth.service
    .from("organization_need_analyses")
    .select(NEED_ANALYSIS_SELECT)
    .order("updated_at", { ascending: false });

  if (dealIds.length) {
    query = query.or(
      `organization_id.eq.${orgId},deal_id.in.(${dealIds.join(",")})`,
    );
  } else {
    query = query.eq("organization_id", orgId);
  }

  const { data, error } = await query;

  if (error) {
    if (/organization_need_analyses|schema cache|does not exist/i.test(error.message)) {
      return NextResponse.json({
        analyses: [],
        deals: [],
        error:
          "Migration besoins non appliquée. Appliquez supabase/migrations/20261121140000_organization_need_analyses.sql",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    analyses: (data ?? []).map((row) => mapNeedAnalysisRow(row as Record<string, unknown>)),
    deals,
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim() || "Analyse du besoin";
  const context_problem = String(body.context_problem ?? "").trim();
  const expected_outcomes = String(body.expected_outcomes ?? "").trim();
  const audience = String(body.audience ?? "").trim();
  const constraints = String(body.constraints ?? "").trim();
  const disability_accommodations = String(body.disability_accommodations ?? "").trim();
  const decided_adaptations = String(body.decided_adaptations ?? "").trim();
  const recommendations = normalizeRecommendations(body.recommendations);
  const deal_id = body.deal_id ? String(body.deal_id) : null;
  const wantComplete = body.markComplete === true;
  const complete = wantComplete &&
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

  const payload = {
    organization_id: orgId,
    deal_id,
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
