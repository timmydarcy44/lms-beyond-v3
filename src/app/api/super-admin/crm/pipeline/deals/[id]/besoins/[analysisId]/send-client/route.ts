import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { mapNeedAnalysisRow } from "@/lib/control/need-analyses";
import {
  selectNeedAnalysisRows,
  sendNeedAnalysisToClient,
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

/** Envoie l'analyse + lien de validation à l'interlocuteur (body : { interlocutor_email }). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; analysisId: string }> },
) {
  const { id: dealId, analysisId } = await context.params;
  const auth = await requireStaff();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const interlocutorEmail = String(body.interlocutor_email ?? "");

  const { data: deal } = await auth.service
    .from("crm_pipeline_deals")
    .select("id, organization_id")
    .eq("id", dealId)
    .maybeSingle();
  if (!deal) return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });

  const { data, error } = await selectNeedAnalysisRows(auth.service, (query) =>
    query.eq("id", analysisId).maybeSingle(),
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });

  const analysis = mapNeedAnalysisRow(data as Record<string, unknown>);
  const orgId = deal.organization_id ? String(deal.organization_id) : null;
  if (!(analysis.deal_id === dealId || (orgId != null && analysis.organization_id === orgId))) {
    return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });
  }

  const result = await sendNeedAnalysisToClient(auth.service, { analysis, interlocutorEmail });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, analysis: result.analysis });
}
