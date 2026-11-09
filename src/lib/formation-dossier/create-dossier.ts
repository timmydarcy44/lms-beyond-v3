import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ASSIGNMENT_KEYS,
  DEFAULT_DOCUMENT_KINDS,
  type FormationDossierSource,
  isDossierDealTriggerStage,
} from "@/lib/formation-dossier/constants";

export type CreateDossierInput = {
  organizationId: string;
  dealId?: string | null;
  source: FormationDossierSource;
  trainingCourseId?: string | null;
  courseTitle?: string | null;
  amountHtCents?: number | null;
  amountTvaCents?: number | null;
  amountTtcCents?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  modalityIntraInter?: "intra" | "inter" | null;
  modalityPresence?: "presentiel" | "distanciel" | "hybride" | null;
  fundingType?: "direct" | "opco" | "subrogation" | null;
  opcoName?: string | null;
  notes?: string | null;
  ownerUserId?: string | null;
  createdBy?: string | null;
  pendingConfirmFields?: string[];
  /** Si source=deal_won et un dossier auto existe déjà → le retourner. */
  idempotentDealWon?: boolean;
};

export type FormationDossierRow = {
  id: string;
  organization_id: string;
  deal_id: string | null;
  status: string;
  source: string;
  [key: string]: unknown;
};

async function seedDossierChildren(
  service: SupabaseClient,
  dossierId: string,
  ownerUserId?: string | null,
) {
  await service.from("formation_documents").insert(
    DEFAULT_DOCUMENT_KINDS.map((doc) => ({
      dossier_id: dossierId,
      kind: doc.kind,
      title: doc.title,
      status: "to_generate",
    })),
  );

  await service.from("formation_assignments").insert(
    ASSIGNMENT_KEYS.map((key) => ({
      dossier_id: dossierId,
      action_key: key,
      assignee_user_id: ownerUserId ?? null,
    })),
  );

  await service.from("formation_events").insert({
    dossier_id: dossierId,
    event_type: "created",
    to_status: "qualification",
    actor_user_id: ownerUserId ?? null,
    payload: {},
  });
}

export async function createFormationDossier(
  service: SupabaseClient,
  input: CreateDossierInput,
): Promise<FormationDossierRow> {
  if (input.source === "deal_won" && input.dealId && input.idempotentDealWon !== false) {
    const { data: existing } = await service
      .from("formation_dossiers")
      .select("*")
      .eq("deal_id", input.dealId)
      .eq("source", "deal_won")
      .maybeSingle();
    if (existing) return existing as FormationDossierRow;
  }

  const pending =
    input.pendingConfirmFields ??
    (input.source === "deal_won"
      ? ["training_course_id", "course_title", "amount_ht_cents", "contact_email", "contact_name"].filter(
          (field) => {
            if (field === "training_course_id") return Boolean(input.trainingCourseId);
            if (field === "course_title") return Boolean(input.courseTitle);
            if (field === "amount_ht_cents") return input.amountHtCents != null;
            if (field === "contact_email") return Boolean(input.contactEmail);
            if (field === "contact_name") return Boolean(input.contactName);
            return false;
          },
        )
      : []);

  const insertRow: Record<string, unknown> = {
    organization_id: input.organizationId,
    deal_id: input.dealId ?? null,
    training_course_id: input.trainingCourseId ?? null,
    course_title: input.courseTitle ?? null,
    amount_ht_cents: input.amountHtCents ?? null,
    amount_tva_cents: input.amountTvaCents ?? null,
    amount_ttc_cents: input.amountTtcCents ?? null,
    contact_name: input.contactName ?? null,
    contact_email: input.contactEmail ?? null,
    contact_phone: input.contactPhone ?? null,
    modality_intra_inter: input.modalityIntraInter ?? null,
    modality_presence: input.modalityPresence ?? null,
    funding_type: input.fundingType ?? null,
    notes: input.notes ?? null,
    owner_user_id: input.ownerUserId ?? null,
    created_by: input.createdBy ?? null,
    source: input.source,
    status: "qualification",
    pending_confirm_fields: pending,
    subcontracting: "aucune",
  };
  if (input.opcoName) insertRow.opco_name = input.opcoName;

  let { data, error } = await service
    .from("formation_dossiers")
    .insert(insertRow)
    .select("*")
    .single();

  if (error && /opco_name/i.test(error.message) && insertRow.opco_name) {
    delete insertRow.opco_name;
    ({ data, error } = await service
      .from("formation_dossiers")
      .insert(insertRow)
      .select("*")
      .single());
  }

  if (error || !data) {
    // Course unique deal_won
    if (error?.code === "23505" && input.dealId) {
      const { data: again } = await service
        .from("formation_dossiers")
        .select("*")
        .eq("deal_id", input.dealId)
        .eq("source", "deal_won")
        .maybeSingle();
      if (again) return again as FormationDossierRow;
    }
    throw new Error(error?.message || "Création dossier impossible");
  }

  await seedDossierChildren(service, String(data.id), input.ownerUserId);
  return data as FormationDossierRow;
}

export async function resolveOrganizationIdForDeal(
  service: SupabaseClient,
  deal: {
    id: string;
    organization_id?: string | null;
    company_id?: string | null;
    company_name?: string | null;
    siret?: string | null;
  },
): Promise<string | null> {
  if (deal.organization_id) return String(deal.organization_id);

  if (deal.company_id) {
    const { data: company } = await service
      .from("companies")
      .select("organization_id")
      .eq("id", deal.company_id)
      .maybeSingle();
    if (company?.organization_id) return String(company.organization_id);
  }

  const siret = String(deal.siret ?? "").replace(/\D/g, "");
  if (siret.length === 14) {
    const { data: org } = await service
      .from("organizations")
      .select("id")
      .eq("siret", siret)
      .maybeSingle();
    if (org?.id) return String(org.id);
  }

  const name = String(deal.company_name ?? "").trim();
  if (!name) return null;

  const slugBase = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const slug = `${slugBase || "entreprise"}-${deal.id.slice(0, 8)}`;

  const { data: created, error } = await service
    .from("organizations")
    .insert({
      name,
      slug,
      siret: siret.length === 14 ? siret : null,
      status: "onboarding",
      kind: "client",
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    console.warn("[formation-dossier] resolve org:", error?.message);
    return null;
  }

  await service
    .from("crm_pipeline_deals")
    .update({ organization_id: created.id })
    .eq("id", deal.id);

  return String(created.id);
}

export async function ensureDossierFromWonDeal(
  service: SupabaseClient,
  dealId: string,
  actorUserId?: string | null,
): Promise<FormationDossierRow | null> {
  const { data: deal, error } = await service
    .from("crm_pipeline_deals")
    .select(
      "id, stage_slug, organization_id, company_id, company_name, siret, email, phone, contact_first_name, contact_last_name, amount_cents, quoted_course_ids",
    )
    .eq("id", dealId)
    .maybeSingle();

  if (error || !deal) return null;
  if (!isDossierDealTriggerStage(String(deal.stage_slug))) return null;

  const organizationId = await resolveOrganizationIdForDeal(service, deal);
  if (!organizationId) {
    console.warn("[formation-dossier] pas d'organisation pour le deal", dealId);
    return null;
  }

  const quoted = Array.isArray(deal.quoted_course_ids) ? deal.quoted_course_ids : [];
  const trainingCourseId = quoted[0] ? String(quoted[0]) : null;
  let courseTitle: string | null = null;
  if (trainingCourseId) {
    const { data: course } = await service
      .from("training_courses")
      .select("title")
      .eq("id", trainingCourseId)
      .maybeSingle();
    courseTitle = course?.title ? String(course.title) : null;
  }

  const contactName = [deal.contact_first_name, deal.contact_last_name]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return createFormationDossier(service, {
    organizationId,
    dealId: deal.id,
    source: "deal_won",
    trainingCourseId,
    courseTitle,
    amountHtCents: deal.amount_cents != null ? Number(deal.amount_cents) : null,
    contactName: contactName || null,
    contactEmail: deal.email ? String(deal.email) : null,
    contactPhone: deal.phone ? String(deal.phone) : null,
    ownerUserId: actorUserId ?? null,
    createdBy: actorUserId ?? null,
    idempotentDealWon: true,
  });
}

export async function syncDealRegressionFlag(
  service: SupabaseClient,
  dealId: string,
  fromStage: string | null | undefined,
  toStage: string | null | undefined,
) {
  const wasTrigger = isDossierDealTriggerStage(fromStage);
  const isTrigger = isDossierDealTriggerStage(toStage);
  if (!wasTrigger || isTrigger) return;

  await service
    .from("formation_dossiers")
    .update({
      deal_regressed: true,
      deal_regressed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("deal_id", dealId);
}
