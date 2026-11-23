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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; analysisId: string }> },
) {
  const { id: orgId, analysisId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const { data, error } = await selectNeedAnalysisRows(auth.service, (query) =>
    query.eq("organization_id", orgId).eq("id", analysisId).maybeSingle(),
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });

  return NextResponse.json({ analysis: mapNeedAnalysisRow(data as Record<string, unknown>) });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; analysisId: string }> },
) {
  const { id: orgId, analysisId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const { data: existing, error: loadError } = await selectNeedAnalysisRows(auth.service, (query) =>
    query.eq("organization_id", orgId).eq("id", analysisId).maybeSingle(),
  );

  if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });

  const current = mapNeedAnalysisRow(existing as Record<string, unknown>);

  const result = await updateNeedAnalysis(auth.service, {
    userId: auth.userId,
    current,
    apply: (query) => query.eq("organization_id", orgId).eq("id", analysisId),
    patch: {
      title: body.title !== undefined ? String(body.title) : undefined,
      deal_id:
        body.deal_id !== undefined ? (body.deal_id ? String(body.deal_id) : null) : undefined,
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
  const { id: orgId, analysisId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const { error } = await auth.service
    .from("organization_need_analyses")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", analysisId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
