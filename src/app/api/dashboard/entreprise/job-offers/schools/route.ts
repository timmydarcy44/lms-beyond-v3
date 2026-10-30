import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const names = new Set<string>();
  if (!query || "byound school".includes(query.toLowerCase()) || query.toLowerCase().includes("byound")) {
    names.add("Byound School");
  }

  const service = getServiceRoleClient();
  if (service && query.length >= 2) {
    const { data } = await service.from("organizations").select("name").ilike("name", `%${query}%`).limit(8);
    for (const row of data ?? []) {
      const name = String((row as { name?: string }).name ?? "").trim();
      if (name) names.add(name);
    }
  }

  const schools = [...names].sort((a, b) => {
    if (a === "Byound School") return -1;
    if (b === "Byound School") return 1;
    return a.localeCompare(b, "fr");
  });
  return NextResponse.json({ schools: schools.map((name) => ({ name })) });
}
