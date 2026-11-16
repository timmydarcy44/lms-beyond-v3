import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadDisabilityReferentContact } from "@/lib/handicap/referent-contact";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  assessQualiopiFicheCompliance,
  CATALOGUE_PROOF_FIELDS,
  formatQualiopiTariff,
  pedagogicalModalityLabel,
  recognitionTypeLabel,
  resolveResultsMethod,
  type CatalogueProofFieldId,
} from "@/lib/training-courses/qualiopi-fiche";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  domain?: string | null;
  objectives?: unknown;
  duration?: unknown;
  formats?: string[] | null;
  badge_name?: string | null;
  badge_class_id?: string | null;
  recognition_type?: string | null;
  recognition_detail?: string | null;
  pedagogical_modality?: string | null;
  pedagogical_modality_detail?: string | null;
  financing_modalities?: string | null;
  price_on_quote?: boolean | null;
  intra_price?: number | null;
  inter_price?: number | null;
  results_method_override?: string | null;
  is_active?: boolean | null;
  updated_at?: string | null;
  organization_id?: string | null;
  source?: string | null;
};

/** Catalogue OF Qualiopi uniquement — exclut sur-mesure client / hors catalogue. */
function isOfCatalogueCourse(row: CourseRow): boolean {
  if (row.organization_id) return false;
  if (row.source != null && row.source !== "catalogue") return false;
  return true;
}

type ExpertRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  headline?: string | null;
  specialties?: unknown;
  photo_url?: string | null;
  avatar_url?: string | null;
  review_status?: string | null;
  is_active?: boolean | null;
  is_test?: boolean | null;
};

function parseObjectives(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((o) => String(o).trim()).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map((o) => String(o).trim()).filter(Boolean);
    } catch {
      return raw
        .split(/\n|;/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function normName(first: string | null | undefined, last: string | null | undefined): string {
  return `${String(first ?? "").trim()} ${String(last ?? "").trim()}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

function looksLikeTestExpert(e: ExpertRow): boolean {
  if (e.is_test === true) return true;
  const email = normEmail(e.email);
  return /demo\.|@expert\.fr|\+test|care\.demo|jade@byound/i.test(email);
}

function buildOnePager(input: {
  title: string;
  objectives: string[];
  course: CourseRow;
  recognition: string;
  modality: string;
  modalityDetail: string;
  resultsMethod: string;
  accessibilityLine: string;
  source: string;
  id: string;
}): string {
  const c = input.course;
  const updated = c.updated_at
    ? new Date(c.updated_at).toLocaleDateString("fr-FR")
    : "—";
  return [
    `# ${input.title}`,
    "",
    "## Objectifs pédagogiques",
    ...input.objectives.map((o, i) => `${i + 1}. ${o}`),
    "",
    "## Type de reconnaissance",
    input.recognition,
    c.recognition_detail?.trim() ? `Précision : ${c.recognition_detail.trim()}` : null,
    "",
    "## Modalités pédagogiques",
    input.modality,
    input.modalityDetail || "À rédiger",
    "",
    "## Durée",
    String(c.duration ?? "").trim() || "À rédiger",
    "",
    "## Modalités de financement",
    c.financing_modalities?.trim() || "À rédiger",
    "",
    "## Tarif",
    formatQualiopiTariff(c),
    "",
    "## Indicateurs de résultats — méthode de calcul",
    input.resultsMethod,
    "",
    "## Accessibilité",
    input.accessibilityLine,
    "",
    `Dernière mise à jour de la fiche : ${updated}`,
    "",
    `Source: ${input.source}/${input.id}`,
  ]
    .filter((line) => line != null)
    .join("\n");
}

/** Liste des formations avec preuve Qualiopi Lot 1 pour dossier auditeur. */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  let trainingRes = await supabase
    .from("training_courses")
    .select("*")
    .is("organization_id", null)
    .limit(400);
  if (trainingRes.error && /organization_id/i.test(trainingRes.error.message)) {
    trainingRes = await supabase.from("training_courses").select("*").limit(400);
  }

  const [expertsRes, ofRes, handicapContact] = await Promise.all([
    supabase
      .from("experts")
      .select(
        "id, first_name, last_name, email, headline, specialties, photo_url, avatar_url, review_status, is_active, is_test",
      )
      .eq("review_status", "approved")
      .limit(100),
    supabase.from("of_settings").select("results_indicators_method").limit(1).maybeSingle(),
    loadDisabilityReferentContact(supabase),
  ]);

  const ofMethod =
    typeof ofRes.data?.results_indicators_method === "string"
      ? ofRes.data.results_indicators_method
      : null;

  const accessibilityOk = Boolean(handicapContact.email);
  const accessibilityLine = `${handicapContact.publicLine} — étude personnalisée de chaque situation.`;

  const allCourses = ((trainingRes.data ?? []) as CourseRow[]).filter(isOfCatalogueCourse);
  const published = allCourses.filter((c) => c.is_active === true);
  const excludedDrafts = allCourses.length - published.length;

  const rows: Array<{
    id: string;
    source: "training_courses";
    title: string;
    domain: string | null;
    objectives: string[];
    objectivesOk: boolean;
    compliant: boolean;
    missing: string[];
    missingIds: CatalogueProofFieldId[];
    filledIds: CatalogueProofFieldId[];
    onePager: string;
  }> = [];

  const fieldMissingCounts: Record<string, number> = {};
  for (const f of CATALOGUE_PROOF_FIELDS) fieldMissingCounts[f.id] = 0;

  for (const row of published) {
    const objectives = parseObjectives(row.objectives);
    const title = String(row.title || row.name || "Formation");
    const compliance = assessQualiopiFicheCompliance(
      {
        ...row,
        objectives,
        formats: row.formats ?? null,
        badge_name: row.badge_name ?? null,
        badge_class_id: row.badge_class_id ?? null,
        duration: row.duration != null ? String(row.duration) : null,
      },
      { accessibilityOk },
    );
    for (const id of compliance.missingIds) {
      fieldMissingCounts[id] = (fieldMissingCounts[id] ?? 0) + 1;
    }
    const resultsMethod = resolveResultsMethod({
      ofSettingsMethod: ofMethod,
      courseOverride: row.results_method_override,
    });
    const recognition =
      recognitionTypeLabel(compliance.resolved.recognition_type) ?? "À rédiger";
    const modality =
      pedagogicalModalityLabel(compliance.resolved.pedagogical_modality) ?? "À rédiger";
    const modalityDetail = compliance.resolved.pedagogical_modality_detail ?? "";
    rows.push({
      id: String(row.id),
      source: "training_courses",
      title,
      domain: row.domain ?? null,
      objectives,
      objectivesOk: objectives.length >= 3,
      compliant: compliance.ok,
      missing: compliance.missing,
      missingIds: compliance.missingIds,
      filledIds: compliance.filledIds,
      onePager: buildOnePager({
        title,
        objectives,
        course: row,
        recognition,
        modality,
        modalityDetail,
        resultsMethod,
        accessibilityLine,
        source: "training_courses",
        id: String(row.id),
      }),
    });
  }

  const withObjectives = rows.filter((r) => r.objectivesOk).length;
  const compliantCount = rows.filter((r) => r.compliant).length;

  // Experts : validés, hors tests, hors comptes démo ; profils role=demo exclus
  const rawExperts = (expertsRes.data ?? []) as ExpertRow[];
  const expertIds = rawExperts.map((e) => e.id);
  const { data: profiles } = expertIds.length
    ? await supabase.from("profiles").select("id, role").in("id", expertIds)
    : { data: [] as Array<{ id: string; role: string | null }> };
  const roleById = new Map((profiles ?? []).map((p) => [p.id, p.role]));

  const hiddenExperts: ExpertRow[] = [];
  const visibleExperts: ExpertRow[] = [];
  for (const e of rawExperts) {
    const role = String(roleById.get(e.id) ?? "");
    const hide =
      looksLikeTestExpert(e) ||
      e.is_active === false ||
      (role && !/expert|formateur|trainer|admin|super/i.test(role));
    if (hide) hiddenExperts.push(e);
    else visibleExperts.push(e);
  }

  // Doublons (même e-mail ou même nom normalisé) — lecture seule
  const byEmail = new Map<string, ExpertRow[]>();
  const byName = new Map<string, ExpertRow[]>();
  for (const e of visibleExperts) {
    const em = normEmail(e.email);
    const nm = normName(e.first_name, e.last_name);
    if (em) byEmail.set(em, [...(byEmail.get(em) ?? []), e]);
    if (nm) byName.set(nm, [...(byName.get(nm) ?? []), e]);
  }
  const duplicateGroups: Array<{
    key: string;
    kind: "email" | "name";
    count: number;
    label: string;
    ids: string[];
  }> = [];
  for (const [key, list] of byEmail) {
    if (list.length > 1) {
      duplicateGroups.push({
        key,
        kind: "email",
        count: list.length,
        label: key,
        ids: list.map((e) => e.id),
      });
    }
  }
  for (const [key, list] of byName) {
    if (list.length > 1) {
      // éviter de re-signaler si déjà couvert par e-mail
      const already = duplicateGroups.some((g) =>
        g.ids.some((id) => list.some((e) => e.id === id)),
      );
      if (!already) {
        duplicateGroups.push({
          key,
          kind: "name",
          count: list.length,
          label: list.map((e) => `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim()).join(" / "),
          ids: list.map((e) => e.id),
        });
      }
    }
  }

  // Variante Tim / Timmy Darcy (fuzzy)
  const timDarcy = visibleExperts.filter((e) => {
    const n = normName(e.first_name, e.last_name);
    return n === "timmy darcy" || n === "tim darcy";
  });
  if (timDarcy.length > 1 && !duplicateGroups.some((g) => g.key.includes("darcy"))) {
    duplicateGroups.push({
      key: "timmy/tim darcy",
      kind: "name",
      count: timDarcy.length,
      label: "Timmy / Tim Darcy",
      ids: timDarcy.map((e) => e.id),
    });
  }

  return NextResponse.json({
    summary: {
      coursesTotal: rows.length,
      publishedCount: rows.length,
      excludedDrafts,
      withObjectives,
      compliantCount,
      approvedExperts: visibleExperts.length,
      expertsOk: visibleExperts.length >= 2,
      hiddenExpertsCount: hiddenExperts.length,
      accessibilityOk,
      handicapEmail: null, // ne pas exposer l’e-mail brut côté carte
      handicapConfigured: accessibilityOk,
      fieldMissingCounts,
      fieldFilledCounts: Object.fromEntries(
        CATALOGUE_PROOF_FIELDS.map((f) => [
          f.id,
          published.length - (fieldMissingCounts[f.id] ?? 0),
        ]),
      ),
      fieldLabels: Object.fromEntries(CATALOGUE_PROOF_FIELDS.map((f) => [f.id, f.label])),
    },
    courses: rows,
    experts: visibleExperts.map((e) => ({
      id: e.id,
      first_name: e.first_name,
      last_name: e.last_name,
      headline: e.headline,
      specialties: e.specialties,
      photo_url: e.photo_url ?? e.avatar_url,
    })),
    expertDuplicates: duplicateGroups,
    diagnostics: {
      rawTrainingCourses: allCourses.length,
      publishedActive: published.length,
      inactiveOrArchived: excludedDrafts,
      note: "Catalogue OF uniquement (organization_id null). Exclut is_active=false et fiches sur-mesure client.",
    },
  });
}
