import { NextRequest, NextResponse } from "next/server";
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

  const dbOffers = offers.map((offer) => ({
    ...offer,
    applications_count: countsByOffer.get(offer.id) ?? 0,
  }));

  if (edgebsDemo) {
    const demo = demoOffersPayload().offers;
    const demoIds = new Set(demo.map((o) => o.id));
    return NextResponse.json({
      offers: [...demo, ...dbOffers.filter((o) => !demoIds.has(o.id))],
    });
  }

  return NextResponse.json({ offers: dbOffers });
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
