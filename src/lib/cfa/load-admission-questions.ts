import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChallengeQuestionRow } from "@/lib/cfa/admission-challenge";
import { getFallbackQuestionsForSpecialization } from "@/lib/cfa/admission-challenge-fallback";

type QuestionRow = {
  id: string;
  specialization: string;
  slug: string;
  label: string;
  prompt: string;
  starter_hint: string | null;
  sort_order: number;
  active: boolean;
};

async function loadActiveBySpecs(db: SupabaseClient, specs: string[]) {
  const { data, error } = await db
    .from("admission_challenge_questions")
    .select("id, specialization, slug, label, prompt, starter_hint, sort_order, active")
    .eq("active", true)
    .in("specialization", specs)
    .order("sort_order", { ascending: true });
  if (error) return [] as QuestionRow[];
  return (data ?? []) as QuestionRow[];
}

async function withLatestVersions(
  db: SupabaseClient,
  selected: QuestionRow[],
): Promise<ChallengeQuestionRow[]> {
  const withVersions: ChallengeQuestionRow[] = [];
  for (const q of selected) {
    const { data: version } = await db
      .from("admission_challenge_question_versions")
      .select("id, version")
      .eq("question_id", q.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    withVersions.push({
      id: q.id,
      specialization: q.specialization,
      slug: q.slug,
      label: q.label,
      prompt: q.prompt,
      starter_hint: q.starter_hint,
      sort_order: q.sort_order,
      active: q.active,
      versionId: String(version?.id ?? `${q.id}-v1`),
      version: Number(version?.version ?? 1),
    });
  }
  return withVersions;
}

/**
 * 1 commune + 2 propres à la filière.
 * Si la filière n’a pas encore 2 questions actives → secours `_fallback`.
 */
export async function loadAdmissionQuestionsBundle(
  db: SupabaseClient,
  specialization: string,
): Promise<{ questions: ChallengeQuestionRow[]; usedFallback: boolean }> {
  const track = String(specialization || "").trim();
  const commonAndOwn = await loadActiveBySpecs(db, ["common", track]);
  const common = commonAndOwn.filter((r) => r.specialization === "common");
  let own = commonAndOwn.filter((r) => r.specialization === track);
  let usedFallback = false;

  if (own.length < 2) {
    const fallback = await loadActiveBySpecs(db, ["_fallback"]);
    own = fallback.filter((r) => r.specialization === "_fallback");
    usedFallback = true;
  }

  const selected = [...common, ...own].slice(0, 3);
  if (selected.length < 3) {
    return {
      questions: getFallbackQuestionsForSpecialization(specialization),
      usedFallback: true,
    };
  }

  return {
    questions: await withLatestVersions(db, selected),
    usedFallback,
  };
}

export async function loadAdmissionQuestionsForSpecialization(
  db: SupabaseClient,
  specialization: string,
): Promise<ChallengeQuestionRow[]> {
  const bundle = await loadAdmissionQuestionsBundle(db, specialization);
  return bundle.questions;
}

export async function loadPrerequisiteLabel(
  db: SupabaseClient,
  specialization: string,
): Promise<string | null> {
  const { data } = await db
    .from("admission_track_prerequisites")
    .select("label")
    .eq("specialization", specialization)
    .maybeSingle();
  return data?.label ? String(data.label) : "un bac";
}
