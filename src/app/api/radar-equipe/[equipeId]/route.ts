import { NextRequest, NextResponse } from "next/server";
import {
  EDGEBS_DEMO_EQUIPES,
  EDGEBS_ORG_ID,
  buildEdgebsDemoEquipeAggregat,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
import { getEquipeForManager } from "@/lib/radar-equipe/auth";
import { countCompletedEmployeeDiagnostics } from "@/lib/radar-equipe/live-diagnostics";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ equipeId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { equipeId } = await context.params;
  const { profile } = await getCurrentProfileWithAccess();
  const edgebsDemo =
    profile?.company_id === EDGEBS_ORG_ID && isEdgebsDemoViewer(profile?.email);
  const demoEquipe = EDGEBS_DEMO_EQUIPES.find((e) => e.id === equipeId);

  if (edgebsDemo && demoEquipe) {
    return NextResponse.json({
      equipe: { id: demoEquipe.id, name: demoEquipe.name },
      aggregat: buildEdgebsDemoEquipeAggregat(demoEquipe.id, EDGEBS_ORG_ID),
      demo: true,
    });
  }

  const { equipe, error: authErr } = await getEquipeForManager(equipeId);
  if (authErr || !equipe) {
    return NextResponse.json({ error: authErr ?? "Accès refusé" }, { status: 403 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("equipe_aggregats")
    .select("*")
    .eq("equipe_id", equipeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data && edgebsDemo) {
    return NextResponse.json({
      equipe: { id: equipe.id, name: equipe.name },
      aggregat: buildEdgebsDemoEquipeAggregat(String(equipe.id), EDGEBS_ORG_ID),
      demo: true,
    });
  }

  const service = getServiceRoleClient();
  const live = service
    ? await countCompletedEmployeeDiagnostics(service, String(equipe.organisation_id))
    : 0;
  const stored = Number((data as { nb_diagnostics_completes?: number } | null)?.nb_diagnostics_completes ?? 0);
  const completed = Math.max(stored, live);
  const today = new Date().toISOString().slice(0, 10);
  const aggregat = data
    ? { ...data, nb_diagnostics_completes: completed, insuffisant: completed < 5 ? true : data.insuffisant }
    : {
        id: "live",
        equipe_id: equipe.id,
        organisation_id: equipe.organisation_id,
        periode_debut: today,
        periode_fin: today,
        nb_membres_actifs: completed,
        nb_diagnostics_completes: completed,
        insuffisant: completed < 5,
        insight_principal: null,
        created_at: new Date().toISOString(),
      };

  return NextResponse.json({
    equipe: { id: equipe.id, name: equipe.name },
    aggregat,
  });
}
