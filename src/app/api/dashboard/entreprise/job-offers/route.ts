import { NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string;
  title: string | null;
  description: string | null;
  city: string | null;
  salary_range: string | null;
  contract_type: string | null;
  status: string | null;
  company_id: string | null;
  created_at: string | null;
};

export async function GET() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ offers: [] });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée", needsOnboarding: true }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const ownerIds = Array.from(new Set([access.organizationId, access.userId].filter(Boolean)));
  const { data, error } = await service
    .from("job_offers")
    .select("id, title, description, city, salary_range, contract_type, status, company_id, created_at")
    .in("company_id", ownerIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const offers = (data ?? []) as OfferRow[];
  const offerIds = offers.map((offer) => offer.id);

  let countsByOffer = new Map<string, number>();
  if (offerIds.length > 0) {
    const { data: applications } = await service
      .from("beyond_connect_applications")
      .select("job_offer_id")
      .in("job_offer_id", offerIds);

    countsByOffer = new Map<string, number>();
    for (const row of applications ?? []) {
      const offerId = String((row as { job_offer_id?: string | null }).job_offer_id ?? "");
      if (!offerId) continue;
      countsByOffer.set(offerId, (countsByOffer.get(offerId) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    offers: offers.map((offer) => ({
      ...offer,
      applications_count: countsByOffer.get(offer.id) ?? 0,
    })),
  });
}
