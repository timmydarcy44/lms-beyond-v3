import type { SupabaseClient } from "@supabase/supabase-js";
import { BYOUND_COMPANY, companyPostalAddress, mergeOfSettingsIntoCompany } from "@/lib/company";
import { daysUntil } from "@/lib/ready/copy-format";
import { bufferFromDb, decryptJson } from "@/lib/ready/crypto";
import { computeDepositDeadline } from "@/lib/ready/lifecycle";
import { resolveOpcoProfile } from "@/lib/ready/opco-profiles";
import type {
  ReadyCompanyFields,
  ReadyFichePayload,
  ReadyLearnerFields,
  ReadyLearnerRow,
} from "@/lib/ready/types";
import type { ReadyPaymentMode } from "@/lib/ready/constants";

const EMPTY_COMPANY: ReadyCompanyFields = {
  siret: "",
  idcc: "",
  headcount: "",
  opco_name: "",
  member_number: "",
};

const EMPTY_LEARNER: ReadyLearnerFields = {
  sex: "",
  date_of_birth: "",
  contract_type: "",
  csp: "",
  entry_date: "",
  diploma_level: "",
  hours: "",
  on_work_time: null,
};

function parseHoursFromDuration(raw: string | null | undefined): number {
  if (!raw) return 0;
  const m = String(raw).match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return 0;
  return Number(m[1].replace(",", "."));
}

function formatDateRange(slots: Array<{ slot_date: string }>): string {
  const dates = [...new Set(slots.map((s) => s.slot_date).filter(Boolean))].sort();
  if (!dates.length) return "Dates à confirmer";
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  if (dates.length === 1) return fmt(dates[0]);
  return `${fmt(dates[0])} et ${fmt(dates[dates.length - 1])}`;
}

function countFilled(company: ReadyCompanyFields, learners: ReadyLearnerRow[], optional: string[]) {
  let ready = 0;
  let total = 0;
  const companyKeys: Array<keyof ReadyCompanyFields> = [
    "siret",
    "idcc",
    "headcount",
    "opco_name",
    "member_number",
  ];
  for (const k of companyKeys) {
    total += 1;
    if (String(company[k] || "").trim()) ready += 1;
  }
  for (const learner of learners) {
    const keys: Array<keyof ReadyLearnerFields> = [
      "sex",
      "date_of_birth",
      "contract_type",
      "csp",
      "hours",
    ];
    if (!optional.includes("learner_entry_date")) keys.push("entry_date");
    else if (optional.includes("learner_entry_date")) {
      // facultatif : compte seulement s'il est demandé — on l'inclut dans total pour EP/Atlas selon profil
      keys.push("entry_date");
    }
    if (optional.includes("learner_diploma") || true) {
      // toujours affiché ; facultatif selon OPCO — compte dans total si présent dans optional list as required inverted
    }
    const required: Array<keyof ReadyLearnerFields> = [
      "sex",
      "date_of_birth",
      "contract_type",
      "csp",
      "hours",
    ];
    if (!optional.includes("learner_entry_date")) required.push("entry_date");
    if (!optional.includes("learner_diploma")) required.push("diploma_level");
    for (const k of required) {
      total += 1;
      const v = learner.fields[k];
      if (v != null && String(v).trim() !== "") ready += 1;
    }
  }
  // prepared byound fields (approx 12) always ready
  const prepared = 12;
  return { ready: ready + prepared, total: total + prepared };
}

export async function loadReadyFiche(
  service: SupabaseClient,
  linkId: string,
): Promise<ReadyFichePayload | null> {
  const { data: link } = await service
    .from("ready_links")
    .select("*")
    .eq("id", linkId)
    .maybeSingle();
  if (!link) return null;

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select(
      "id, organization_id, training_course_id, course_title, amount_ht_cents, amount_tva_cents, amount_ttc_cents, modality_intra_inter, modality_presence, funding_type, opco_name, session_id, contact_name",
    )
    .eq("id", link.dossier_id)
    .maybeSingle();
  if (!dossier) return null;

  const [{ data: org }, { data: ofRow }, { data: course }, { data: learnersRows }, { data: docs }] =
    await Promise.all([
      service
        .from("organizations")
        .select(
          "id, name, siret, opco_name, idcc, headcount, opco_member_number, address_line, address_zip, address_city",
        )
        .eq("id", dossier.organization_id)
        .maybeSingle(),
      service.from("of_settings").select("*").limit(1).maybeSingle(),
      dossier.training_course_id
        ? service
            .from("training_courses")
            .select("id, title, short_description, duration, objectives")
            .eq("id", dossier.training_course_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      service
        .from("ready_learners")
        .select("id, participant_id, first_name, last_name, fields_enc, sort_order")
        .eq("link_id", linkId)
        .order("sort_order", { ascending: true }),
      service
        .from("formation_documents")
        .select("kind, status, storage_path, file_url")
        .eq("dossier_id", link.dossier_id)
        .in("kind", ["devis", "programme", "convention"]),
    ]);

  let slotsQuery = service
    .from("formation_slots")
    .select("slot_date, starts_at, ends_at, location_label, day_part");
  if (dossier.session_id) {
    slotsQuery = slotsQuery.eq("session_id", dossier.session_id);
  } else {
    slotsQuery = slotsQuery.eq("dossier_id", dossier.id);
  }
  const { data: slots } = await slotsQuery.order("slot_date", { ascending: true });

  const companyOf = mergeOfSettingsIntoCompany(ofRow as Record<string, unknown> | null);
  const formulaRaw = String(dossier.modality_intra_inter || "intra").toLowerCase();
  const formula: "intra" | "inter" = formulaRaw.includes("inter") ? "inter" : "intra";

  const learners: ReadyLearnerRow[] = (learnersRows ?? []).map((row) => {
    const fields =
      decryptJson<ReadyLearnerFields>(bufferFromDb(row.fields_enc)) || { ...EMPTY_LEARNER };
    return {
      id: String(row.id),
      participant_id: row.participant_id ? String(row.participant_id) : null,
      first_name: String(row.first_name || ""),
      last_name: String(row.last_name || ""),
      fields: { ...EMPTY_LEARNER, ...fields },
    };
  });

  const decryptedCompany =
    decryptJson<ReadyCompanyFields>(bufferFromDb(link.company_fields_enc)) || null;
  const company: ReadyCompanyFields = {
    siret: decryptedCompany?.siret || String(org?.siret || ""),
    idcc: decryptedCompany?.idcc || String((org as { idcc?: string } | null)?.idcc || ""),
    headcount:
      decryptedCompany?.headcount ||
      ((org as { headcount?: number } | null)?.headcount != null
        ? String((org as { headcount?: number }).headcount)
        : ""),
    opco_name:
      decryptedCompany?.opco_name ||
      String(org?.opco_name || dossier.opco_name || ""),
    member_number:
      decryptedCompany?.member_number ||
      String((org as { opco_member_number?: string } | null)?.opco_member_number || ""),
  };

  const opcoName = company.opco_name || org?.opco_name || dossier.opco_name;
  const profile = resolveOpcoProfile(opcoName);

  const learnersCount = Math.max(learners.length, 1);
  const ht = Number(dossier.amount_ht_cents || 0);
  const tva = Number(dossier.amount_tva_cents || 0);
  const ttc = Number(dossier.amount_ttc_cents || 0);
  const durationHours =
    parseHoursFromDuration(course?.duration ? String(course.duration) : null) ||
    Math.max(
      1,
      Math.round(
        ((slots ?? []).length * 3.5 + Number.EPSILON) * 100,
      ) / 100,
    );
  const perLearner =
    formula === "inter" ? ht : Math.round(ht / learnersCount);
  const perHour = durationHours > 0 ? Math.round(perLearner / durationHours) : 0;

  const sessionStart = slots?.[0]?.starts_at
    ? new Date(String(slots[0].starts_at))
    : slots?.[0]?.slot_date
      ? new Date(`${slots[0].slot_date}T08:00:00.000Z`)
      : null;
  const { data: devisDoc } = await service
    .from("formation_documents")
    .select("sent_at")
    .eq("id", link.document_id)
    .maybeSingle();
  const depositDeadline = computeDepositDeadline({
    sessionStart,
    devisSentAt: devisDoc?.sent_at ? new Date(String(devisDoc.sent_at)) : new Date(String(link.created_at)),
  });

  const progress = countFilled(company, learners, profile.optionalLearnerFields);

  const docByKind = new Map((docs ?? []).map((d) => [String(d.kind), d]));
  const objectives = Array.isArray(course?.objectives)
    ? (course!.objectives as string[]).filter(Boolean)
    : [];

  const paymentMode = (link.payment_mode as ReadyPaymentMode | null) || "subrogation";
  const iban = ofRow?.iban ? String(ofRow.iban) : null;

  return {
    link: {
      id: String(link.id),
      status: String(link.status),
      expires_at: String(link.expires_at),
      submitted_at: link.submitted_at ? String(link.submitted_at) : null,
      opened_at: link.opened_at ? String(link.opened_at) : null,
      recipient_email: String(link.recipient_email),
      recipient_name: link.recipient_name ? String(link.recipient_name) : null,
      payment_mode: paymentMode,
      progress_ready: progress.ready,
      progress_total: progress.total,
      days_until_expiry: daysUntil(link.expires_at),
    },
    deposit_deadline: depositDeadline.toISOString(),
    days_until_deposit: daysUntil(depositDeadline),
    course: {
      title: String(course?.title || dossier.course_title || "Formation"),
      dates_label: formatDateRange(slots ?? []),
      duration_hours: durationHours,
      formula: formula === "inter" ? "Inter-entreprise" : "Intra-entreprise",
      modality: String(dossier.modality_presence || "Présentiel"),
      location: String(slots?.[0]?.location_label || "À confirmer"),
      learners_count: learners.length,
      objective: objectives[0] || String(course?.short_description || ""),
      certifying: false,
      rncp_or_rs: null,
    },
    of: {
      legal_name: companyOf.legal_name || BYOUND_COMPANY.legal_name,
      siret: companyOf.siret,
      nda: companyOf.nda,
      qualiopi: "Qualiopi — actions de formation",
      address: companyPostalAddress(companyOf),
      contact: companyOf.email,
      iban: paymentMode === "subrogation" ? iban : null,
      bic: paymentMode === "subrogation" && ofRow?.bic ? String(ofRow.bic) : null,
      bank_holder:
        paymentMode === "subrogation" && ofRow?.bank_account_holder
          ? String(ofRow.bank_account_holder)
          : null,
    },
    amounts: {
      ht_cents: ht,
      tva_cents: tva,
      ttc_cents: ttc,
      per_learner_ht_cents: perLearner,
      per_hour_per_learner_cents: perHour,
      formula,
    },
    organization: {
      name: String(org?.name || ""),
      opco_name: opcoName ? String(opcoName) : null,
    },
    company,
    learners,
    opco_profile: {
      id: profile.id,
      label: profile.label,
      portal_name: profile.portalName,
      portal_url: profile.portalUrl,
      portal_cta_label: profile.portalCtaLabel,
      optional_learner_fields: profile.optionalLearnerFields,
    },
    attachments: [
      {
        key: "devis",
        label: "Devis signé",
        available: ["sent", "opened", "signed"].includes(
          String(docByKind.get("devis")?.status || ""),
        ),
      },
      {
        key: "programme",
        label: "Programme détaillé",
        available: Boolean(docByKind.get("programme")?.storage_path || docByKind.get("programme")?.file_url),
      },
      {
        key: "qualiopi",
        label: "Certificat Qualiopi",
        available: Boolean(process.env.READY_QUALIOPI_CERT_URL?.trim()),
      },
      {
        key: "convention",
        label: "Convention de formation",
        available: ["sent", "opened", "signed"].includes(
          String(docByKind.get("convention")?.status || ""),
        ),
      },
    ],
    tutorial_url: process.env.READY_TUTORIAL_URL?.trim() || null,
  };
}

export async function updateReadyProgress(
  service: SupabaseClient,
  linkId: string,
): Promise<void> {
  const fiche = await loadReadyFiche(service, linkId);
  if (!fiche) return;
  await service
    .from("ready_links")
    .update({
      progress_ready: fiche.link.progress_ready,
      progress_total: fiche.link.progress_total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", linkId);
}
