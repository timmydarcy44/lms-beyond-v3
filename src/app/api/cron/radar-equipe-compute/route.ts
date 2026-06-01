import { NextRequest, NextResponse } from "next/server";
import { computeEquipeAggregats } from "@/lib/radar-equipe/compute-aggregats";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 500 });
  }

  const { data: equipes, error } = await service.from("equipes").select("id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { equipeId: string; ok: boolean; insuffisant?: boolean }[] = [];
  for (const eq of equipes ?? []) {
    try {
      const r = await computeEquipeAggregats(eq.id as string);
      results.push({ equipeId: eq.id as string, ok: true, insuffisant: r.insuffisant });
    } catch {
      results.push({ equipeId: eq.id as string, ok: false });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
