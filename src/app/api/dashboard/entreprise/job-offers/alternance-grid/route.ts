import { NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ grid: null });

  const { data, error } = await service
    .from("alternance_salary_grid")
    .select("updated_on, min_cents, period")
    .order("min_cents", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data || typeof data.min_cents !== "number") return NextResponse.json({ grid: null });
  return NextResponse.json({
    grid: {
      updated_on: data.updated_on,
      min_cents: data.min_cents,
      period: data.period === "year" ? "year" : "month",
    },
  });
}
