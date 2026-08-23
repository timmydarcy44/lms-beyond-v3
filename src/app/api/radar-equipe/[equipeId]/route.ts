import { NextRequest, NextResponse } from "next/server";
import {
  EDGEBS_DEMO_EQUIPES,
  EDGEBS_ORG_ID,
  buildEdgebsDemoEquipeAggregat,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
import { getEquipeForManager } from "@/lib/radar-equipe/auth";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServerClient } from "@/lib/supabase/server";

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

  return NextResponse.json({
    equipe: { id: equipe.id, name: equipe.name },
    aggregat: data ?? null,
  });
}
