import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { mapNeedAnalysisRow } from "@/lib/control/need-analyses";
import {
  selectNeedAnalysisRows,
  updateNeedAnalysis,
} from "@/lib/control/need-analyses-server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireStaff() {
  const supabase = await getServerClient();
  if (!supabase) return null;
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

  const { data, error } = await selectNeedAnalysisRows(service, (query) =>
    query.eq("id", analysisId).maybeSingle(),
  );

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

  const result = await updateNeedAnalysis(auth.service, {
    userId: auth.userId,
    current,
    apply: (query) => query.eq("id", analysisId),
    patch: {
      title: body.title !== undefined ? String(body.title) : undefined,
      deal_id: dealId,
      organization_id: scoped.orgId ?? current.organization_id,
    },
    body,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, missing: result.missing },
      { status: result.status },
    );
  }
  return NextResponse.json({ analysis: result.analysis });
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
