import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChallengeQuestionRow } from "@/lib/cfa/admission-challenge";
import { resolveQuestionSpecialization } from "@/lib/cfa/admission-challenge";
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

export async function loadAdmissionQuestionsForSpecialization(
  db: SupabaseClient,
  specialization: string,
): Promise<ChallengeQuestionRow[]> {
  const track = resolveQuestionSpecialization(specialization);
  const { data, error } = await db
    .from("admission_challenge_questions")
    .select("id, specialization, slug, label, prompt, starter_hint, sort_order, active")
    .eq("active", true)
    .in("specialization", ["common", track])
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return getFallbackQuestionsForSpecialization(specialization);
  }

  const rows = data as QuestionRow[];
  const common = rows.filter((r) => r.specialization === "common");
  const own = rows.filter((r) => r.specialization === track);
  const selected = [...common, ...own].slice(0, 3);
  if (selected.length < 3) {
    return getFallbackQuestionsForSpecialization(specialization);
  }

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
