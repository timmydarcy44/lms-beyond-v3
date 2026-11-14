import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  assessQualiopiFicheCompliance,
  formatQualiopiTariff,
  pedagogicalModalityLabel,
  recognitionTypeLabel,
  resolveResultsMethod,
} from "@/lib/training-courses/qualiopi-fiche";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  objectives?: unknown;
  duration?: unknown;
  prerequisites?: unknown;
  recognition_type?: string | null;
  recognition_detail?: string | null;
  pedagogical_modality?: string | null;
  pedagogical_modality_detail?: string | null;
  financing_modalities?: string | null;
  price_on_quote?: boolean | null;
  intra_price?: number | null;
  inter_price?: number | null;
  results_method_override?: string | null;
  updated_at?: string | null;
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

function buildOnePager(input: {
  title: string;
  objectives: string[];
  course: CourseRow;
  resultsMethod: string;
  source: string;
  id: string;
}): string {
  const c = input.course;
  const modality = pedagogicalModalityLabel(c.pedagogical_modality) ?? "À rédiger";
  const recognition = recognitionTypeLabel(c.recognition_type) ?? "À rédiger";
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
    recognition,
    c.recognition_detail?.trim() ? `Précision : ${c.recognition_detail.trim()}` : null,
    "",
    "## Modalités pédagogiques",
    modality,
    c.pedagogical_modality_detail?.trim()
      ? c.pedagogical_modality_detail.trim()
      : "À rédiger",
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
    "Référent handicap : referent-handicap@byound.fr — étude personnalisée de chaque situation.",
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

  const [trainingRes, coursesRes, expertsRes, ofRes] = await Promise.all([
    supabase.from("training_courses").select("*").limit(200),
    supabase.from("courses").select("id, title, name, objectives").limit(200),
    supabase
      .from("experts")
      .select("id, first_name, last_name, headline, review_status")
      .eq("review_status", "approved")
      .limit(50),
    supabase.from("of_settings").select("results_indicators_method").limit(1).maybeSingle(),
  ]);

  const ofMethod =
    typeof ofRes.data?.results_indicators_method === "string"
      ? ofRes.data.results_indicators_method
      : null;

  const rows: Array<{
    id: string;
    source: "training_courses" | "courses";
    title: string;
    objectives: string[];
    objectivesOk: boolean;
    compliant: boolean;
    missing: string[];
    onePager: string;
  }> = [];

  for (const row of (trainingRes.data ?? []) as CourseRow[]) {
    const objectives = parseObjectives(row.objectives);
    const title = String(row.title || row.name || "Formation");
    const compliance = assessQualiopiFicheCompliance({
      ...row,
      objectives,
    });
    const resultsMethod = resolveResultsMethod({
      ofSettingsMethod: ofMethod,
      courseOverride: row.results_method_override,
    });
    rows.push({
      id: String(row.id),
      source: "training_courses",
      title,
      objectives,
      objectivesOk: objectives.length >= 3,
      compliant: compliance.ok,
      missing: compliance.missing,
      onePager: buildOnePager({
        title,
        objectives,
        course: row,
        resultsMethod,
        source: "training_courses",
        id: String(row.id),
      }),
    });
  }

  for (const row of (coursesRes.data ?? []) as CourseRow[]) {
    if (rows.some((r) => r.id === String(row.id))) continue;
    const objectives = parseObjectives(row.objectives);
    const title = String(row.title || row.name || "Formation");
    const compliance = assessQualiopiFicheCompliance({ objectives });
    rows.push({
      id: String(row.id),
      source: "courses",
      title,
      objectives,
      objectivesOk: objectives.length >= 3,
      compliant: false,
      missing: [
        ...compliance.missing,
        "Fiche LMS hors catalogue training_courses — compléter la fiche catalogue",
      ],
      onePager: [
        `# ${title}`,
        "",
        "## Objectifs pédagogiques",
        ...(objectives.length ? objectives.map((o, i) => `${i + 1}. ${o}`) : ["(à compléter)"]),
        "",
        "## Accessibilité",
        "Référent handicap : referent-handicap@byound.fr — étude personnalisée de chaque situation.",
      ].join("\n"),
    });
  }

  const withObjectives = rows.filter((r) => r.objectivesOk).length;
  const compliantCount = rows.filter((r) => r.compliant).length;

  return NextResponse.json({
    summary: {
      coursesTotal: rows.length,
      withObjectives,
      compliantCount,
      approvedExperts: (expertsRes.data ?? []).length,
      expertsOk: (expertsRes.data ?? []).length >= 2,
    },
    courses: rows,
    experts: expertsRes.data ?? [],
  });
}
