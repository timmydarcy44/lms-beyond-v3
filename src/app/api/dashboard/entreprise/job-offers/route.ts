import { NextResponse } from "next/server";
import {
  EDGEBS_DEMO_JOB_OFFERS,
  EDGEBS_ORG_ID,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
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
  school_id?: string | null;
  created_at: string | null;
};

function demoOffersPayload() {
  return {
    offers: EDGEBS_DEMO_JOB_OFFERS.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      city: o.city,
      salary_range: o.salary_range,
      contract_type: o.contract_type,
      status: o.status,
      school_id: EDGEBS_ORG_ID,
      created_at: new Date().toISOString(),
      applications_count: o.applications_count,
      demo: true,
    })),
  };
}

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

  const edgebsDemo =
    access.organizationId === EDGEBS_ORG_ID && isEdgebsDemoViewer(access.viewer.email);
  // Mocks d’abord — évite les schémas hétérogènes (company_id vs school_id)
  if (edgebsDemo) {
    return NextResponse.json(demoOffersPayload());
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  // Schéma actuel: job_offers.school_id (pas company_id)
  const { data, error } = await service
    .from("job_offers")
    .select("id, title, description, city, salary_range, contract_type, status, school_id, created_at")
    .eq("school_id", access.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const offers = (data ?? []) as OfferRow[];
  const offerIds = offers.map((offer) => offer.id);

  let countsByOffer = new Map<string, number>();
  if (offerIds.length > 0) {
    const { data: applications } = await service
      .from("applications")
      .select("job_id")
      .in("job_id", offerIds);

    countsByOffer = new Map<string, number>();
    for (const row of applications ?? []) {
      const offerId = String((row as { job_id?: string | null }).job_id ?? "");
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
