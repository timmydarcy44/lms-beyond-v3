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
    applications: applications.map((row) => {
      const item: Record<string, unknown> = {
        id: row.id,
        created_at: row.created_at,
        status: row.status,
        stage: applicationStage(row),
        source: row.source,
        interview_at: row.interview_at,
        profiles: row.talent_id && profiles.get(row.talent_id) ? [profiles.get(row.talent_id)] : [],
      };
      if ("read_at" in row) item.read_at = row.read_at ?? null;
      return item;
    }),
  });
}

export async function PATCH(request: NextRequest, context: Params) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }
  if (isJadeDemoEmail(access.viewer.email)) {
    return NextResponse.json({ ok: true });
  }

  const { id } = await context.params;
  let body: {
    status?: unknown;
    applicationId?: unknown;
    title?: unknown;
    description?: unknown;
    requirements?: unknown;
    city?: unknown;
    salary_range?: unknown;
    contract_type?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: offer } = await service.from("job_offers").select("id, school_id").eq("id", id).maybeSingle();
  if (!offer || String((offer as { school_id?: string | null }).school_id ?? "") !== access.organizationId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (body.applicationId) {
    const applicationId = String(body.applicationId);
    const updated = await service
      .from("applications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", applicationId)
      .eq("job_id", id);
    if (updated.error && !/column|schema cache|42703|does not exist/i.test(updated.error.message)) {
      return NextResponse.json({ error: "Lecture impossible" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status != null) {
    const status = String(body.status).toLowerCase();
    if (!["active", "paused", "closed", "draft"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    patch.status = status;
  }
  for (const key of ["title", "description", "requirements", "city", "salary_range", "contract_type"] as const) {
    if (typeof body[key] === "string") patch[key] = String(body[key]).trim();
  }
  const { error } = await service.from("job_offers").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
