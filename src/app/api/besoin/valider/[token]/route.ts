import { NextRequest, NextResponse } from "next/server";
import { mapNeedAnalysisRow, type OrganizationNeedAnalysis } from "@/lib/control/need-analyses";
import {
  hashClientValidationToken,
  logNeedAnalysisActivity,
  persistNeedAnalysisPdf,
  resolveClientName,
  selectNeedAnalysisRows,
} from "@/lib/control/need-analyses-server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || null;
}

async function findByToken(
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  token: string,
): Promise<{ analysis: OrganizationNeedAnalysis | null; error?: string }> {
  if (token.length < 16) return { analysis: null };
  const hash = hashClientValidationToken(token);
  const { data, error } = await selectNeedAnalysisRows(service, (query) =>
    query.eq("client_validation_token", hash).maybeSingle(),
  );
  if (error) return { analysis: null, error: error.message };
  if (!data) return { analysis: null };
  return { analysis: mapNeedAnalysisRow(data as Record<string, unknown>) };
}

/** Résumé minimal pour la page publique (aucun contenu détaillé n'est exposé). */
export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { analysis, error } = await findByToken(service, String(token ?? "").trim());
  if (error) return NextResponse.json({ error: "Lien indisponible" }, { status: 503 });
  if (!analysis) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });

  return NextResponse.json({
    title: analysis.title,
    client_name: await resolveClientName(service, analysis),
    exchange_date: analysis.exchange_date,
    validated: Boolean(analysis.client_validated_at),
    client_validated_at: analysis.client_validated_at,
  });
}

/** Le client valide l'analyse : horodatage serveur + IP + email tracés dans le Journal. */
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { analysis, error } = await findByToken(service, String(token ?? "").trim());
  if (error) return NextResponse.json({ error: "Lien indisponible" }, { status: 503 });
  if (!analysis) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });

  if (analysis.client_validated_at && analysis.client_validation_source === "link") {
    return NextResponse.json({
      ok: true,
      already: true,
      client_validated_at: analysis.client_validated_at,
    });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = String(body.email ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Indiquez un e-mail valide pour tracer la validation." },
      { status: 400 },
    );
  }
  const ip = clientIp(request);
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const fullUpdate: Record<string, unknown> = {
    client_validated_at: day,
    client_validated_at_ts: now.toISOString(),
    client_validation_source: "link",
    client_validated_ip: ip,
    client_validated_by_email: email,
    updated_at: now.toISOString(),
  };

  let updateError = (
    await service.from("organization_need_analyses").update(fullUpdate).eq("id", analysis.id)
  ).error;
  if (updateError && /client_validation_|column|schema cache/i.test(updateError.message)) {
    // Migration traçabilité pas encore appliquée : au moins la date.
    updateError = (
      await service
        .from("organization_need_analyses")
        .update({ client_validated_at: day, updated_at: now.toISOString() })
        .eq("id", analysis.id)
    ).error;
  }
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await logNeedAnalysisActivity(service, {
    organizationId: analysis.organization_id,
    actorUserId: analysis.conducted_by || analysis.created_by || analysis.id,
    actorType: "client",
    action: "Analyse du besoin validée par le client (lien mail)",
    payload: {
      analysis_id: analysis.id,
      title: analysis.title,
      client_validated_at: day,
      email,
      ip,
    },
  });

  if (analysis.status === "complete" || analysis.pdf_storage_path) {
    await persistNeedAnalysisPdf(service, {
      ...analysis,
      client_validated_at: day,
      client_validation_source: "link",
      client_validated_by_email: email,
      client_validated_ip: ip,
      client_validated_at_ts: now.toISOString(),
    });
  }

  return NextResponse.json({ ok: true, client_validated_at: day });
}
