import { NextRequest, NextResponse } from "next/server";
import {
  EDGEBS_DEMO_JOB_OFFERS,
  EDGEBS_ORG_ID,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { buildJadeOfferDetail } from "@/lib/demo/jade-dashboard-mocks";
import { demoApplicationRows, fetchApplications, applicationStage } from "@/lib/entreprise/application-stage";
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

  if (isJadeDemoEmail(access.viewer.email)) {
    const jade = buildJadeOfferDetail(id);
    if (jade) return NextResponse.json(jade);
  }

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
        applications: demoApplicationRows(demo.id).map((row) => {
          const [first, ...rest] = String(row.name ?? "Candidat").split(" ");
          return {
            id: row.id,
            created_at: row.created_at,
            status: row.stage,
            stage: row.stage,
            read_at: row.read_at ?? null,
            match_score: null,
            profiles: [{ id: row.talent_id, first_name: first, last_name: rest.join(" ") }],
          };
        }),
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

  const applications = (await fetchApplications(service, [id])).filter((row) => applicationStage(row) !== "rejected");
  const talentIds = [...new Set(applications.map((row) => row.talent_id).filter((value): value is string => Boolean(value)))];
  const profiles = new Map<string, { id: string; first_name: string | null; last_name: string | null }>();
  if (talentIds.length > 0) {
    const { data: people } = await service.from("profiles").select("id, first_name, last_name").in("id", talentIds);
    for (const person of people ?? []) {
      profiles.set(String(person.id), {
        id: String(person.id),
        first_name: (person.first_name as string | null) ?? null,
        last_name: (person.last_name as string | null) ?? null,
      });
    }
  }

  return NextResponse.json({
    offer,
    applications: applications.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      status: row.status,
      stage: applicationStage(row),
      read_at: "read_at" in row ? row.read_at ?? null : null,
      match_score: null,
      profiles: row.talent_id && profiles.get(row.talent_id) ? [profiles.get(row.talent_id)] : [],
    })),
  });
}
