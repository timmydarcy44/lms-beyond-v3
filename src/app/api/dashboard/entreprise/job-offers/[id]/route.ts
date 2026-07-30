import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: Params) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée", needsOnboarding: true }, { status: 400 });
  }

  const { id } = await context.params;
  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: offer, error } = await service
    .from("job_offers")
    .select("id, title, description, requirements, city, salary_range, contract_type, status, company_id, created_at")
    .eq("id", id)
    .single();

  if (error || !offer) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }

  const ownerIds = new Set([access.organizationId, access.userId]);
  if (!ownerIds.has(String((offer as { company_id?: string | null }).company_id ?? ""))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: applications } = await service
    .from("beyond_connect_applications")
    .select(
      `
      id,
      created_at,
      match_score,
      profiles(
        id,
        first_name,
        last_name
      )
    `,
    )
    .eq("job_offer_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    offer,
    applications: applications ?? [],
  });
}
