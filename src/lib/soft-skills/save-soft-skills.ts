import type { SupabaseClient } from "@supabase/supabase-js";

import { SOFT_SKILLS, SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills/questions";

export function computeSoftSkillsScores(answers: Record<string, number>) {
  const scores: Record<string, number> = {};
  for (let compId = 1; compId <= SOFT_SKILLS.length; compId += 1) {
    const skill = SOFT_SKILLS[compId - 1];
    const total =
      (answers[`${compId}_1`] || 0) + (answers[`${compId}_2`] || 0) + (answers[`${compId}_3`] || 0);
    scores[skill.titre] = total;
  }
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  return { scores, totalScore };
}

export function validateSoftSkillsAnswers(answers: Record<string, number>): string | null {
  const expectedKeys = new Set(SOFT_SKILLS_QUESTIONS.map((q) => q.id));
  const answerKeys = Object.keys(answers);

  if (answerKeys.length !== SOFT_SKILLS_QUESTIONS.length) {
    return `Réponses incomplètes (${answerKeys.length}/${SOFT_SKILLS_QUESTIONS.length}).`;
  }

  for (const key of answerKeys) {
    const value = answers[key];
    if (!expectedKeys.has(key) || typeof value !== "number" || value < 1 || value > 5) {
      return "Certaines réponses sont invalides.";
    }
  }

  return null;
}

export function buildSoftSkillsPayload(learnerId: string, answers: Record<string, number>) {
  const { scores, totalScore } = computeSoftSkillsScores(answers);
  return {
    learner_id: learnerId,
    answers,
    scores,
    total_score: totalScore,
    taken_at: new Date().toISOString(),
  };
}

export async function saveSoftSkillsResultats(
  supabase: SupabaseClient,
  learnerId: string,
  answers: Record<string, number>,
) {
  const validationError = validateSoftSkillsAnswers(answers);
  if (validationError) {
    return { error: { message: validationError }, payload: null };
  }

  const payload = buildSoftSkillsPayload(learnerId, answers);
  const { error } = await supabase.from("soft_skills_resultats").upsert(payload, {
    onConflict: "learner_id",
  });

  return { error, payload };
}
