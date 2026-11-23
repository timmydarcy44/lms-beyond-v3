import { NextRequest, NextResponse } from "next/server";
import { mapNeedAnalysisRow, type OrganizationNeedAnalysis } from "@/lib/control/need-analyses";
import {
  hashClientValidationToken,
  persistNeedAnalysisPdf,
  resolveClientName,
  selectNeedAnalysisRows,
} from "@/lib/control/need-analyses-server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

/** Le client valide l'analyse : renseigne client_validated_at (date du jour). */
export async function POST(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { analysis, error } = await findByToken(service, String(token ?? "").trim());
  if (error) return NextResponse.json({ error: "Lien indisponible" }, { status: 503 });
  if (!analysis) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });

  if (analysis.client_validated_at) {
    return NextResponse.json({ ok: true, already: true, client_validated_at: analysis.client_validated_at });
  }

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const { error: updateError } = await service
    .from("organization_need_analyses")
    .update({ client_validated_at: day, updated_at: now.toISOString() })
    .eq("id", analysis.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // PDF preuve régénéré avec la date de validation client (best effort).
  if (analysis.status === "complete" || analysis.pdf_storage_path) {
    await persistNeedAnalysisPdf(service, { ...analysis, client_validated_at: day });
  }

  return NextResponse.json({ ok: true, client_validated_at: day });
}
