import {
  getJessicaQuestionnaire,
  JESSICA_QUESTIONNAIRES,
  JESSICA_QUESTIONNAIRE_SLUGS,
  type JessicaQuestionnaireDef,
  type JessicaQuestionnaireSlug,
  type JessicaQuestionDef,
} from "@/lib/jessica-contentin/questionnaires/definitions.generated";

export {
  getJessicaQuestionnaire,
  JESSICA_QUESTIONNAIRES,
  JESSICA_QUESTIONNAIRE_SLUGS,
};
export type {
  JessicaQuestionnaireDef,
  JessicaQuestionnaireSlug,
  JessicaQuestionDef,
  JessicaQuestionType,
};

const LIKERT4: Record<string, number> = {
  Jamais: 0,
  Parfois: 1,
  Souvent: 2,
  "Très souvent": 3,
};

const LIKERT5: Record<string, number> = {
  Jamais: 0,
  Rarement: 1,
  Parfois: 2,
  Souvent: 3,
  Toujours: 4,
};

const IMPACT: Record<string, number> = {
  "Pas du tout": 0,
  Peu: 1,
  Modérément: 2,
  Beaucoup: 3,
  Enormément: 4,
};

export function scoreJessicaAnswers(
  slug: string,
  answers: Record<string, unknown>,
  questions?: JessicaQuestionDef[],
): { score: number | null; scoreLabel: string | null } {
  const defQuestions = questions ?? getJessicaQuestionnaire(slug)?.questions ?? [];
  if (slug === "situation-enfant" || defQuestions.length === 0) {
    // Scoring générique Likert si options connues
  }

  let score = 0;
  let counted = 0;

  for (const q of defQuestions) {
    const raw = answers[q.id];
    if (raw == null || raw === "" || raw === false) continue;
    const v = String(raw);

    if (slug === "tdah" && LIKERT4[v] != null) {
      score += LIKERT4[v];
      counted++;
    } else if (slug === "pre-diagnostic-dys" && LIKERT5[v] != null) {
      score += LIKERT5[v];
      counted++;
    } else if (slug === "metacognition" && (v === "0" || v === "1")) {
      score += Number(v);
      counted++;
    } else if (slug === "stress-academique") {
      if (/^\d+$/.test(v)) {
        score += Number(v);
        counted++;
      } else if (LIKERT5[v] != null) {
        score += LIKERT5[v];
        counted++;
      } else if (IMPACT[v] != null) {
        score += IMPACT[v];
        counted++;
      }
    } else if (q.type === "boolean" && (v === "0" || v === "1")) {
      score += Number(v);
      counted++;
    } else if (q.type === "single" && q.options?.length) {
      const idx = q.options.indexOf(v);
      if (idx >= 0) {
        score += idx;
        counted++;
      }
    } else if (q.type === "scale" && /^\d+$/.test(v)) {
      score += Number(v);
      counted++;
    }
  }

  if (!counted) return { score: null, scoreLabel: null };

  let scoreLabel: string | null = null;
  if (slug === "tdah") {
    if (score <= 15) scoreLabel = "Score ≤ 15 (faible)";
    else if (score <= 30) scoreLabel = "Score entre 16 et 30 (modéré)";
    else scoreLabel = "Score > 30 (élevé)";
  } else {
    scoreLabel = `Score ${score}`;
  }

  return { score, scoreLabel };
}

export function listJessicaQuestionnaires(): JessicaQuestionnaireDef[] {
  return JESSICA_QUESTIONNAIRE_SLUGS.map((slug) => JESSICA_QUESTIONNAIRES[slug]);
}

export function normalizePersonKey(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function newQuestionId(prefix = "q"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
