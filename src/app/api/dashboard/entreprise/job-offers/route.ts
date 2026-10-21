import { NextRequest, NextResponse } from "next/server";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeOffresPayload } from "@/lib/demo/jade-dashboard-mocks";
import {
  applicationStage,
  demoApplicationRows,
  fetchApplications,
  summarizeApplications,
  type LoadedApplication,
} from "@/lib/entreprise/application-stage";
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

function offerFromApplications(offer: {
  id: string;
  title: string;
  description: string;
  city: string;
  salary_range: string;
  contract_type: string;
  status: string;
}, rows: LoadedApplication[]) {
  const summary = summarizeApplications(rows);
  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    city: offer.city,
    salary_range: offer.salary_range,
    contract_type: offer.contract_type,
    status: offer.status,
    school_id: EDGEBS_ORG_ID,
    created_at: new Date().toISOString(),
    applications_count: summary.total,
    unread_count: summary.unread,
    stages: summary.stages,
    demo: true,
  };
}

function demoOffersPayload() {
  return {
    offers: EDGEBS_DEMO_JOB_OFFERS.map((offer) => offerFromApplications(offer, demoApplicationRows(offer.id))),
    recent: recentFromRows(EDGEBS_DEMO_JOB_OFFERS.flatMap((offer) => demoApplicationRows(offer.id)), new Map(
      EDGEBS_DEMO_JOB_OFFERS.map((offer) => [offer.id, offer.title]),
    )),
  };
}

function recentFromRows(rows: LoadedApplication[], titles: Map<string, string>, names = new Map<string, string>()) {
  return rows
    .map((row) => ({ row, stage: applicationStage(row) }))
    .filter((item) => item.stage !== "rejected")
    .sort((a, b) => String(b.row.created_at ?? "").localeCompare(String(a.row.created_at ?? "")))
    .slice(0, 6)
    .map(({ row, stage }) => ({
      id: row.id,
      offer_id: row.job_id,
      offer_title: titles.get(row.job_id) ?? "",
      name: row.name || names.get(row.talent_id ?? "") || "Candidat",
      created_at: row.created_at,
      stage,
      href: row.talent_id
        ? `/dashboard/entreprise/offres/${row.job_id}/candidats/${row.talent_id}`
        : `/dashboard/entreprise/offres/${row.job_id}`,
    }));
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
  if (isJadeDemoEmail(access.viewer.email)) {
    return NextResponse.json(jadeOffresPayload());
  }

  const edgebsDemo =
    access.organizationId === EDGEBS_ORG_ID && isEdgebsDemoViewer(access.viewer.email);

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await service
    .from("job_offers")
    .select("id, title, description, city, salary_range, contract_type, status, school_id, created_at")
    .eq("school_id", access.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    if (edgebsDemo) return NextResponse.json(demoOffersPayload());
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const offers = (data ?? []) as OfferRow[];
  const applications = await fetchApplications(service, offers.map((offer) => offer.id));
  const titles = new Map(offers.map((offer) => [offer.id, offer.title ?? ""]));
  const names = await profileNames(service, applications.map((row) => row.talent_id));
  const dbOffers = offers.map((offer) => {
    const summary = summarizeApplications(applications.filter((row) => row.job_id === offer.id));
    return {
      ...offer,
      applications_count: summary.total,
      unread_count: summary.unread,
      stages: summary.stages,
    };
  });

  if (edgebsDemo) {
    const demo = demoOffersPayload();
    const demoIds = new Set(demo.offers.map((offer) => offer.id));
    const visible = dbOffers.filter((offer) => !demoIds.has(offer.id));
    const visibleIds = new Set(visible.map((offer) => offer.id));
    return NextResponse.json({
      offers: [...demo.offers, ...visible],
      recent: recentFromRows(
        [
          ...EDGEBS_DEMO_JOB_OFFERS.flatMap((offer) => demoApplicationRows(offer.id)),
          ...applications.filter((row) => visibleIds.has(row.job_id)),
        ],
        new Map([...titles, ...EDGEBS_DEMO_JOB_OFFERS.map((offer) => [offer.id, offer.title] as const)]),
        names,
      ),
    });
  }

  return NextResponse.json({
    offers: dbOffers,
    recent: recentFromRows(applications, titles, names),
  });
}

async function profileNames(service: NonNullable<ReturnType<typeof getServiceRoleClient>>, talentIds: Array<string | null>) {
  const ids = [...new Set(talentIds.filter((id): id is string => Boolean(id)))];
  const names = new Map<string, string>();
  if (ids.length === 0) return names;
  const { data } = await service.from("profiles").select("id, first_name, last_name, full_name").in("id", ids);
  for (const row of data ?? []) {
    const full = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || String(row.full_name ?? "").trim();
    if (full) names.set(String(row.id), full);
  }
  return names;
}

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access || "configurationRequired" in access) {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 400 });
  }

  let body: {
    title?: unknown;
    city?: unknown;
    contract_type?: unknown;
    salary_range?: unknown;
    remote_policy?: unknown;
    description?: unknown;
    requirements?: unknown;
    benefits?: unknown;
    experience_level?: unknown;
    education_level?: unknown;
    soft_skills?: unknown;
    hard_skills?: unknown;
    status?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title || !description) {
    return NextResponse.json({ error: "Titre et description requis" }, { status: 400 });
  }

  const statusRaw = String(body.status ?? "published").trim().toLowerCase();
  const status = statusRaw === "draft" ? "draft" : "published";
  const city = String(body.city ?? "").trim() || null;
  const contract_type = String(body.contract_type ?? "").trim() || null;
  const salary_range = String(body.salary_range ?? "").trim() || null;
  const benefits = String(body.benefits ?? "").trim() || null;
  const remote_policy = String(body.remote_policy ?? "").trim() || null;
  const experience_level = String(body.experience_level ?? "").trim();
  const education_level = String(body.education_level ?? "").trim();
  const softSkills = Array.isArray(body.soft_skills)
    ? body.soft_skills.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const hardSkills = Array.isArray(body.hard_skills)
    ? body.hard_skills.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const requirementsParts = [
    String(body.requirements ?? "").trim(),
    experience_level && experience_level !== "Non spécifiée"
      ? `Expérience souhaitée : ${experience_level}`
      : "",
    education_level && education_level !== "Non requis"
      ? `Niveau de formation : ${education_level}`
      : "",
    softSkills.length > 0 ? `Soft skills : ${softSkills.join(", ")}` : "",
    hardSkills.length > 0 ? `Hard skills : ${hardSkills.join(", ")}` : "",
  ].filter(Boolean);
  const requirements = requirementsParts.join("\n") || null;

  const descriptionWithMeta = [
    description,
    remote_policy ? `\n\nModalité : ${remote_policy}` : "",
    benefits ? `\n\nAvantages :\n${benefits}` : "",
  ]
    .join("")
    .trim();

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const baseInsert: Record<string, unknown> = {
    school_id: access.organizationId,
    title,
    description: descriptionWithMeta,
    city,
    salary_range,
    contract_type,
    status: status === "draft" ? "draft" : "active",
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await service
    .from("job_offers")
    .insert({ ...baseInsert, requirements })
    .select("id, title, description, city, salary_range, contract_type, status, created_at")
    .maybeSingle();

  if (error && /requirements|schema cache/i.test(error.message)) {
    ({ data, error } = await service
      .from("job_offers")
      .insert(baseInsert)
      .select("id, title, description, city, salary_range, contract_type, status, created_at")
      .maybeSingle());
  }

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Création impossible" }, { status: 400 });
  }

  return NextResponse.json({ offer: data });
}
