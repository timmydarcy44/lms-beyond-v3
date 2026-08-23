import { NextRequest, NextResponse } from "next/server";
import {
  EDGEBS_DEMO_JOB_OFFERS,
  EDGEBS_ORG_ID,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
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

  const edgebsDemo =
    access.organizationId === EDGEBS_ORG_ID && isEdgebsDemoViewer(access.viewer.email);
  if (edgebsDemo) {
    const demo = EDGEBS_DEMO_JOB_OFFERS.find((o) => o.id === id);
    if (demo) {
      return NextResponse.json({
        offer: {
          id: demo.id,
          title: demo.title,
          description: demo.description,
          requirements: demo.requirements,
          city: demo.city,
          salary_range: demo.salary_range,
          contract_type: demo.contract_type,
          status: demo.status,
          school_id: EDGEBS_ORG_ID,
          created_at: new Date().toISOString(),
        },
        applications: [
          {
            id: `${demo.id}-app-1`,
            created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            match_score: 86,
            profiles: [{ id: "edgebs-cand-1", first_name: "Léa", last_name: "Bernard" }],
          },
          {
            id: `${demo.id}-app-2`,
            created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            match_score: 74,
            profiles: [{ id: "edgebs-cand-2", first_name: "Hugo", last_name: "Moreau" }],
          },
        ],
        demo: true,
      });
    }
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: offer, error } = await service
    .from("job_offers")
    .select("id, title, description, requirements, city, salary_range, contract_type, status, school_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !offer) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }

  if (String((offer as { school_id?: string | null }).school_id ?? "") !== access.organizationId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: applications } = await service
    .from("applications")
    .select(
      `
      id,
      created_at,
      status,
      profiles:talent_id(
        id,
        first_name,
        last_name
      )
    `,
    )
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    offer,
    applications: (applications ?? []).map((row) => ({
      ...row,
      match_score: null,
      profiles: Array.isArray((row as { profiles?: unknown }).profiles)
        ? (row as { profiles: unknown[] }).profiles
        : (row as { profiles?: unknown }).profiles
          ? [(row as { profiles: unknown }).profiles]
          : [],
    })),
  });
}
