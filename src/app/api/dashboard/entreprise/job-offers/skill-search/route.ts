import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { findCatalogSkill, searchCatalog } from "@/lib/entreprise/offer-skill-catalog";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 1) return NextResponse.json({ skills: [], canAdd: false });

  const skills = searchCatalog(query, 8).map((skill) => ({ ...skill, source: "catalog" as const }));
  if ("organizationId" in access) {
    const service = getServiceRoleClient();
    if (service) {
      const { data } = await service
        .from("offer_skill_items")
        .select("label, kind")
        .eq("organization_id", access.organizationId)
        .ilike("label", `%${query}%`)
        .limit(6);
      for (const row of data ?? []) {
        const label = String(row.label ?? "").trim();
        if (!label || skills.some((skill) => skill.label.toLowerCase() === label.toLowerCase())) continue;
        skills.push({ label, kind: row.kind === "soft" ? "soft" : "hard", source: "catalog" });
      }
    }
  }

  const exact = Boolean(findCatalogSkill(query)) || skills.some((skill) => skill.label.toLowerCase() === query.toLowerCase());
  return NextResponse.json({ skills: skills.slice(0, 8), canAdd: query.length >= 2 && !exact });
}
