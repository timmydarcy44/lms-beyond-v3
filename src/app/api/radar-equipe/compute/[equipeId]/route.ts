import { NextRequest, NextResponse } from "next/server";
import { getEquipeForManager } from "@/lib/radar-equipe/auth";
import { computeEquipeAggregats } from "@/lib/radar-equipe/compute-aggregats";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ equipeId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { equipeId } = await context.params;
  if (!equipeId) {
    return NextResponse.json({ error: "equipeId requis" }, { status: 400 });
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
