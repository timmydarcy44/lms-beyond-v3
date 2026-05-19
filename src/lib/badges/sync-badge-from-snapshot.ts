import type { SupabaseClient } from "@supabase/supabase-js";
import type { CourseBuilderSnapshot } from "@/types/course-builder";

/** Valeurs `evaluation_type` alignées sur la config métier / colonne `text` en base (pas d’ENUM SQL dédié dans la migration). */
export type BadgeEvaluationTypeSql =
  | "qcm"
  | "case_study"
  | "audio_presentation"
  | "audio_negotiation"
  | "file_upload"
  | "video_presentation";

const LEGACY: Record<string, BadgeEvaluationTypeSql> = {
  audio_ia: "audio_negotiation",
  audio_interview: "audio_negotiation",
  technical_deliverable: "file_upload",
};

export function normalizeBadgeEvaluationType(raw: string | undefined | null): BadgeEvaluationTypeSql {
  const t = String(raw ?? "").trim();
  if (LEGACY[t]) return LEGACY[t];
  const allowed: BadgeEvaluationTypeSql[] = [
    "qcm",
    "case_study",
    "audio_presentation",
    "audio_negotiation",
    "file_upload",
    "video_presentation",
  ];
  return (allowed.includes(t as BadgeEvaluationTypeSql) ? t : "qcm") as BadgeEvaluationTypeSql;
}

function parseUuid(s: string | undefined | null): string | null {
  const t = String(s ?? "").trim();
  if (!t) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t) ? t : null;
}

/**
 * Upsert `public.badges` pour `course_id` à partir du builder snapshot (`onConflict: code` avec `course-${courseId}`).
 * N’échoue pas la sauvegarde cours : log uniquement en cas d’erreur RLS / contrainte.
 */
export async function syncBadgeToDatabase(
  supabase: SupabaseClient,
  courseId: string,
  snapshot: CourseBuilderSnapshot,
): Promise<{ ok: boolean; error?: string }> {
  const g = snapshot.general;
  const label = String(g.badgeLabel ?? "").trim();
  if (!courseId || !label) {
    return { ok: true };
  }

  const evaluationType = normalizeBadgeEvaluationType(g.badge_evaluation_type);

  const competenciesLines = String(g.badge_competencies_text ?? "")
    .split("\n")
    .map((x) => x.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
  const objectivesFromSnapshot = Array.isArray(snapshot.objectives) ? snapshot.objectives.filter(Boolean) : [];
  const objectives =
    competenciesLines.length > 0 ? competenciesLines : objectivesFromSnapshot.length > 0 ? objectivesFromSnapshot : [];

  const modalities = String(g.badge_modalities_obtention ?? "").trim() || null;

  const criteriaHtml = String(g.badge_criteria_html ?? "").trim() || null;
  const modalitiesSelected = Array.isArray(g.badge_modalities_keys)
    ? (g.badge_modalities_keys as string[]).filter(Boolean)
    : [];
  const oralIaEvalPrompt = String(g.badge_oral_ia_evaluation_prompt ?? "").trim() || null;
  const technicalEndpoint = String(g.badge_technical_json_endpoint ?? "").trim() || null;

  const audioScenario =
    evaluationType === "audio_presentation"
      ? String(g.badge_audio_presentation_scenario ?? "").trim() || null
      : evaluationType === "audio_negotiation"
        ? String(g.badge_audio_negotiation_scenario ?? "").trim() || null
        : null;

  const code = `course-${courseId}`;

  const row: Record<string, unknown> = {
    course_id: courseId,
    code,
    label,
    description: String(g.badgeDescription ?? "").trim() || null,
    level: String(g.level ?? g.badge_level ?? "Intermédiaire").trim() || "Intermédiaire",
    objectives,
    modalities,
    evaluation_type: evaluationType,
    quiz_test_id: evaluationType === "qcm" ? parseUuid(g.badge_quiz_test_id) : null,
    case_prompt: evaluationType === "case_study" ? String(g.badge_case_prompt ?? "").trim() || null : null,
    audio_scenario: audioScenario,
    video_presentation_url:
      evaluationType === "video_presentation" ? String(g.badge_video_presentation_url ?? "").trim() || null : null,
    technical_deliverable_url:
      evaluationType === "file_upload" ? String(g.badge_file_upload_instructions ?? "").trim() || null : null,
    criteria_html: criteriaHtml,
    modalities_selected: modalitiesSelected,
    oral_ia_evaluation_prompt: oralIaEvalPrompt,
    technical_json_endpoint: technicalEndpoint,
    active: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("badges").upsert(row as never, { onConflict: "code" });

  if (error) {
    console.error("[syncBadgeToDatabase]", courseId, error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
