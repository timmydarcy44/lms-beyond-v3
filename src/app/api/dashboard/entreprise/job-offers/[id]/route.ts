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
import { formatOfferPay } from "@/lib/entreprise/offer-conditions";
import { offerCandidatureSchema, offerConditionsSchema, offerPosteSchema, offerReadyToPublish } from "@/lib/entreprise/offer-publish";
import { criteriaForApplications, listOfferSkills } from "@/lib/entreprise/offer-skills";
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

  const baseSelect = "id, title, description, requirements, city, salary_range, contract_type, status, school_id, created_at, updated_at";
  const posteSelect = `${baseSelect}, work_mode, contract_duration, diploma_prepared, alternance_school, work_rhythm, experience_level, education_level, salary_min, salary_max, salary_period, hours_per_week, start_label, headcount, benefits`;
  const fullSelect = `${posteSelect}, recruitment_steps, requested_documents, screening_questions, application_deadline, diffusion`;
  let { data: offer, error } = await service.from("job_offers").select(fullSelect).eq("id", id).maybeSingle();
  if (error && /column|schema cache/i.test(error.message)) {
    ({ data: offer, error } = await service.from("job_offers").select(posteSelect).eq("id", id).maybeSingle());
  }
  if (error && /column|schema cache/i.test(error.message)) {
    ({ data: offer, error } = await service.from("job_offers").select(baseSelect).eq("id", id).maybeSingle());
  }

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

  const criteria = await criteriaForApplications(
    service,
    id,
    applications.map((row) => row.talent_id).filter((value): value is string => Boolean(value)),
  );

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
        criteria_total: criteria.total,
        criteria_met: row.talent_id ? criteria.metByTalent.get(row.talent_id) ?? 0 : 0,
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
    intent?: unknown;
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
  if (body.intent === "publish") {
    const publishSelects = [
      "title, contract_type, description, city, salary_range, work_mode, salary_min, benefits, recruitment_steps, diffusion",
      "title, contract_type, description, city, salary_range, work_mode, salary_min, benefits",
      "title, contract_type, description, city, salary_range",
    ];
    let currentQuery = await service.from("job_offers").select(publishSelects[0]).eq("id", id).maybeSingle();
    for (const select of publishSelects.slice(1)) {
      if (!currentQuery.error || !/work_mode|column|schema cache/i.test(currentQuery.error.message)) break;
      currentQuery = await service.from("job_offers").select(select).eq("id", id).maybeSingle();
    }
    const current = currentQuery.data;
    let requiredSkills = 0;
    try {
      requiredSkills = (await listOfferSkills(service, id)).filter((skill) => skill.importance === "required").length;
    } catch {
      requiredSkills = 0;
    }
    if (!offerReadyToPublish({ ...(current ?? {}), required_skills: requiredSkills })) {
      return NextResponse.json({ error: "La checklist n'est pas complète." }, { status: 400 });
    }
    patch.status = "active";
  }
  if (body.status != null && body.intent !== "publish") {
    const status = String(body.status).toLowerCase();
    if (!["active", "paused", "closed", "draft"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    patch.status = status;
  }
  const parsedPoste = offerPosteSchema.safeParse(body);
  if (!parsedPoste.success && body.intent !== "publish" && body.applicationId == null && body.status == null) {
    return NextResponse.json({ error: "Champs du poste invalides" }, { status: 400 });
  }
  const poste = parsedPoste.success ? parsedPoste.data : {};
  for (const [key, value] of Object.entries(poste)) {
    if (typeof value === "string") patch[key] = value;
  }
  for (const key of ["requirements", "salary_range"] as const) {
    if (typeof body[key] === "string") patch[key] = String(body[key]).trim();
  }
  const conditions = offerConditionsSchema.safeParse(body);
  if (conditions.success) {
    const data = conditions.data;
    if ("salary_min" in data) patch.salary_min = data.salary_min ?? null;
    if ("salary_max" in data) patch.salary_max = data.salary_max ?? null;
    if (data.salary_period) patch.salary_period = data.salary_period;
    if ("hours_per_week" in data) patch.hours_per_week = data.hours_per_week ?? null;
    if ("start_label" in data) patch.start_label = data.start_label ?? "";
    if ("headcount" in data) patch.headcount = data.headcount ?? null;
    if (data.benefits) patch.benefits = data.benefits;
    const formatted = formatOfferPay(data.salary_min, data.salary_max, data.salary_period);
    if (formatted) patch.salary_range = formatted;
  }
  const candidatureKeys = ["recruitment_steps", "requested_documents", "screening_questions", "application_deadline", "diffusion"] as const;
  const candidature = offerCandidatureSchema.safeParse(body);
  if (candidatureKeys.some((key) => key in body) && !candidature.success) {
    return NextResponse.json({ error: "Champs de candidature invalides" }, { status: 400 });
  }
  if (candidature.success) {
    const data = candidature.data;
    if (data.recruitment_steps) patch.recruitment_steps = data.recruitment_steps;
    if (data.requested_documents) patch.requested_documents = data.requested_documents;
    if (data.screening_questions) patch.screening_questions = data.screening_questions;
    if ("application_deadline" in data) patch.application_deadline = data.application_deadline ?? null;
    if (data.diffusion) patch.diffusion = data.diffusion;
  }

  let { error } = await service.from("job_offers").update(patch).eq("id", id);
  const optional = ["work_mode", "contract_duration", "diploma_prepared", "alternance_school", "work_rhythm", "experience_level", "education_level", "requirements", "salary_min", "salary_max", "salary_period", "hours_per_week", "start_label", "headcount", "benefits", "recruitment_steps", "requested_documents", "screening_questions", "application_deadline", "diffusion"] as const;
  const dropped: string[] = [];
  for (const key of optional) {
    if (!error || !(key in patch)) continue;
    if (!new RegExp(key, "i").test(error.message)) continue;
    dropped.push(key);
    delete patch[key];
    ({ error } = await service.from("job_offers").update(patch).eq("id", id));
  }
  if (error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 400 });
  if (dropped.some((key) => key !== "requirements")) {
    return NextResponse.json(
      { error: dropped.some((key) => candidatureKeys.includes(key as (typeof candidatureKeys)[number]))
        ? "Le poste est enregistré. Collez la migration 20261024200000 pour garder les étapes, les pièces et la diffusion."
        : dropped.some((key) => String(key).startsWith("salary") || key === "benefits" || key === "hours_per_week" || key === "start_label" || key === "headcount")
          ? "Le poste est enregistré. Collez la migration 20261024180000 pour garder la rémunération et les avantages."
          : "Le texte du poste est enregistré. Collez la migration 20261024140000 pour garder la modalité, l'alternance et l'expérience." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
