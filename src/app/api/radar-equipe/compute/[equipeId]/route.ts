import { NextRequest, NextResponse } from "next/server";
import {
  EDGEBS_DEMO_EQUIPES,
  EDGEBS_ORG_ID,
  buildEdgebsDemoEquipeAggregat,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getEquipeForManager } from "@/lib/radar-equipe/auth";
import { computeEquipeAggregats } from "@/lib/radar-equipe/compute-aggregats";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ equipeId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { equipeId } = await context.params;
  if (!equipeId) {
    return NextResponse.json({ error: "equipeId requis" }, { status: 400 });
  }

  const { profile } = await getCurrentProfileWithAccess();
  const edgebsDemo =
    profile?.company_id === EDGEBS_ORG_ID && isEdgebsDemoViewer(profile?.email);
  const demoEquipe = EDGEBS_DEMO_EQUIPES.find((e) => e.id === equipeId);

  if (edgebsDemo && demoEquipe) {
    const aggregat = buildEdgebsDemoEquipeAggregat(demoEquipe.id, EDGEBS_ORG_ID);
    return NextResponse.json({
      insuffisant: false,
      nbDiagnostics: aggregat.nb_diagnostics_completes,
      aggregat: {
        id: aggregat.id,
        periode_debut: aggregat.periode_debut,
        periode_fin: aggregat.periode_fin,
        insight_principal: aggregat.insight_principal,
        insuffisant: false,
      },
      demo: true,
    });
  }

  const { error: authErr } = await getEquipeForManager(equipeId);
  if (authErr) {
    return NextResponse.json({ error: authErr }, { status: 403 });
  }

  try {
    const result = await computeEquipeAggregats(equipeId);
    return NextResponse.json({
      insuffisant: result.insuffisant,
      nbDiagnostics: result.nbDiagnostics,
      aggregat: result.aggregat
        ? {
            id: result.aggregat.id,
            periode_debut: result.aggregat.periode_debut,
            periode_fin: result.aggregat.periode_fin,
            insight_principal: result.aggregat.insight_principal,
            insuffisant: result.aggregat.insuffisant,
          }
        : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur de calcul";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
