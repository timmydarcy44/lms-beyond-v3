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

  const dealOptions = [
    {
      id: dealId,
      label: String(deal.company_name || "Deal").trim() || "Deal",
      stage: deal.stage_slug ? String(deal.stage_slug) : null,
    },
  ];

  const { data, error } = await selectNeedAnalysisRows(auth.service, (query) => {
    const ordered = query.order("updated_at", { ascending: false });
    return orgId
      ? ordered.or(`deal_id.eq.${dealId},organization_id.eq.${orgId}`)
      : ordered.eq("deal_id", dealId);
  });

  if (error) {
    if (isNeedAnalysisTableMissing(error.message)) {
      return NextResponse.json({
        analyses: [],
        deals: dealOptions,
        organizationId: orgId,
        error: MIGRATION_HINT,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    analyses: ((data as unknown[]) ?? []).map((row) =>
      mapNeedAnalysisRow(row as Record<string, unknown>),
    ),
    deals: dealOptions,
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
  const result = await createNeedAnalysis(auth.service, {
    userId: auth.userId,
    organizationId: deal.organization_id ? String(deal.organization_id) : null,
    dealId,
    title:
      String(body.title ?? "").trim() ||
      `Analyse — ${String(deal.company_name || "entreprise").trim()}`,
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
