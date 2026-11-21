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

async function loadScopedAnalysis(
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  dealId: string,
  analysisId: string,
) {
  const { data: deal } = await service
    .from("crm_pipeline_deals")
    .select("id, organization_id")
    .eq("id", dealId)
    .maybeSingle();
  if (!deal) return { error: "Deal introuvable" as const, status: 404 as const };

  const { data, error } = await service
    .from("organization_need_analyses")
    .select(NEED_ANALYSIS_SELECT)
    .eq("id", analysisId)
    .maybeSingle();

  if (error) return { error: error.message, status: 500 as const };
  if (!data) return { error: "Analyse introuvable" as const, status: 404 as const };

  const row = mapNeedAnalysisRow(data as Record<string, unknown>);
  const orgId = deal.organization_id ? String(deal.organization_id) : null;
  const allowed =
    row.deal_id === dealId || (orgId != null && row.organization_id === orgId);
  if (!allowed) return { error: "Analyse introuvable" as const, status: 404 as const };

  return { analysis: row, orgId };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; analysisId: string }> },
) {
  const { id: dealId, analysisId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const scoped = await loadScopedAnalysis(auth.service, dealId, analysisId);
  if ("error" in scoped && !("analysis" in scoped)) {
    return NextResponse.json({ error: scoped.error }, { status: scoped.status });
  }
  const current = scoped.analysis!;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const next = {
    title: body.title !== undefined ? String(body.title).trim() || current.title : current.title,
    deal_id: dealId,
    organization_id: scoped.orgId ?? current.organization_id,
    context_problem:
      body.context_problem !== undefined
        ? String(body.context_problem).trim()
        : current.context_problem,
    expected_outcomes:
      body.expected_outcomes !== undefined
        ? String(body.expected_outcomes).trim()
        : current.expected_outcomes,
    audience: body.audience !== undefined ? String(body.audience).trim() : current.audience,
    constraints:
      body.constraints !== undefined ? String(body.constraints).trim() : current.constraints,
    disability_accommodations:
      body.disability_accommodations !== undefined
        ? String(body.disability_accommodations).trim()
        : current.disability_accommodations,
    decided_adaptations:
      body.decided_adaptations !== undefined
        ? String(body.decided_adaptations).trim()
        : current.decided_adaptations,
    recommendations:
      body.recommendations !== undefined
        ? normalizeRecommendations(body.recommendations)
        : current.recommendations,
  };

  const wantComplete = body.markComplete === true || current.status === "complete";
  const fieldsComplete = isNeedAnalysisComplete(next);
  if (body.markComplete === true && !fieldsComplete) {
    return NextResponse.json(
      { error: "Pour marquer l’analyse complète, renseignez les 6 blocs principaux." },
      { status: 400 },
    );
  }
  const forceDraft = body.markComplete === false;
  const complete = !forceDraft && wantComplete && fieldsComplete;

  const { data, error } = await auth.service
    .from("organization_need_analyses")
    .update({
      ...next,
      status: complete ? "complete" : "draft",
      completed_at: complete ? current.completed_at ?? new Date().toISOString() : null,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", analysisId)
    .select(NEED_ANALYSIS_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ analysis: mapNeedAnalysisRow(data as Record<string, unknown>) });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; analysisId: string }> },
) {
  const { id: dealId, analysisId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const scoped = await loadScopedAnalysis(auth.service, dealId, analysisId);
  if ("error" in scoped && !("analysis" in scoped)) {
    return NextResponse.json({ error: scoped.error }, { status: scoped.status });
  }

  const { error } = await auth.service
    .from("organization_need_analyses")
    .delete()
    .eq("id", analysisId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
