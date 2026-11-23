import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { mapNeedAnalysisRow } from "@/lib/control/need-analyses";
import {
  createNeedAnalysis,
  isNeedAnalysisTableMissing,
  selectNeedAnalysisRows,
} from "@/lib/control/need-analyses-server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MIGRATION_HINT =
  "Migration besoins non appliquée. Appliquez supabase/migrations/20261121140000_organization_need_analyses.sql";

async function requireStaff() {
  const supabase = await getServerClient();
  if (!supabase) return null;
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

  const { data, error } = await selectNeedAnalysisRows(auth.service, (query) => {
    const ordered = query.order("updated_at", { ascending: false });
    return dealIds.length
      ? ordered.or(`organization_id.eq.${orgId},deal_id.in.(${dealIds.join(",")})`)
      : ordered.eq("organization_id", orgId);
  });

  if (error) {
    if (isNeedAnalysisTableMissing(error.message)) {
      return NextResponse.json({ analyses: [], deals: [], error: MIGRATION_HINT });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    analyses: ((data as unknown[]) ?? []).map((row) =>
      mapNeedAnalysisRow(row as Record<string, unknown>),
    ),
    deals,
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await createNeedAnalysis(auth.service, {
    userId: auth.userId,
    organizationId: orgId,
    dealId: body.deal_id ? String(body.deal_id) : null,
    title: String(body.title ?? "").trim() || "Analyse du besoin",
    body,
  });

  if (!result.ok) {
    if (result.status === 500 && isNeedAnalysisTableMissing(result.error)) {
      return NextResponse.json({ error: MIGRATION_HINT }, { status: 503 });
    }
    return NextResponse.json(
      { error: result.error, missing: result.missing },
      { status: result.status },
    );
  }
  return NextResponse.json({ analysis: result.analysis });
}
