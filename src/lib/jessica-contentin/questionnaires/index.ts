import {
  getJessicaQuestionnaire as getJessicaQuestionnaireRaw,
  JESSICA_QUESTIONNAIRES,
  JESSICA_QUESTIONNAIRE_SLUGS,
  type JessicaQuestionnaireDef,
  type JessicaQuestionnaireSlug,
  type JessicaQuestionDef,
  type JessicaQuestionType,
} from "@/lib/jessica-contentin/questionnaires/definitions.generated";

export {
  JESSICA_QUESTIONNAIRES,
  JESSICA_QUESTIONNAIRE_SLUGS,
};
export type {
  JessicaQuestionnaireDef,
  JessicaQuestionnaireSlug,
  JessicaQuestionDef,
  JessicaQuestionType,
};

export function getJessicaQuestionnaire(slug: string): JessicaQuestionnaireDef | null {
  const def = getJessicaQuestionnaireRaw(slug);
  return def ? sanitizeJessicaQuestionnaire(def) : null;
}

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

  return { score, scoreLabel: interpretJessicaScore(slug, score) };
}

/** Repères issus des réponses Typeform historiques (cohortes Jessica). */
export type JessicaScoreBenchmark = {
  average: number;
  sampleSize: number;
  maxTheoretical: number | null;
  /** Plus le score est élevé… */
  higherMeans: "better" | "more_difficulty";
  bands: { max: number; label: string }[];
  hint: string;
};

export const JESSICA_SCORE_BENCHMARKS: Record<string, JessicaScoreBenchmark> = {
  metacognition: {
    average: 36,
    sampleSize: 308,
    maxTheoretical: 52,
    higherMeans: "better",
    bands: [
      { max: 31, label: "sous la moyenne (compétences métacognitives à renforcer)" },
      { max: 42, label: "dans la moyenne" },
      { max: 999, label: "au-dessus de la moyenne (bon niveau métacognitif)" },
    ],
    hint: "Moyenne Typeform ≈ 36 / 52 (n=308). Un score plus élevé = meilleures stratégies d’apprentissage.",
  },
  "stress-academique": {
    average: 28,
    sampleSize: 280,
    maxTheoretical: null,
    higherMeans: "more_difficulty",
    bands: [
      { max: 22, label: "sous la moyenne (stress plutôt bas)" },
      { max: 33, label: "dans la moyenne" },
      { max: 999, label: "au-dessus de la moyenne (stress élevé)" },
    ],
    hint: "Moyenne Typeform ≈ 28 (n=280). Un score plus élevé = plus de stress académique perçu.",
  },
  "pre-diagnostic-dys": {
    average: 28,
    sampleSize: 278,
    maxTheoretical: null,
    higherMeans: "more_difficulty",
    bands: [
      { max: 22, label: "sous la moyenne (peu de signaux)" },
      { max: 32, label: "dans la moyenne" },
      { max: 999, label: "au-dessus de la moyenne (signaux plus marqués)" },
    ],
    hint: "Moyenne Typeform ≈ 28 (n=278). Un score plus élevé = davantage de difficultés signalées (pré-repérage, pas un diagnostic).",
  },
  tdah: {
    average: 32,
    sampleSize: 4,
    maxTheoretical: 60,
    higherMeans: "more_difficulty",
    bands: [
      { max: 15, label: "faible" },
      { max: 30, label: "modéré" },
      { max: 45, label: "élevé" },
      { max: 999, label: "très élevé" },
    ],
    hint: "Échelle 0–60. ≤15 faible · 16–30 modéré · 31–45 élevé · ≥46 très élevé.",
  },
};

export function interpretJessicaScore(slug: string, score: number): string {
  const bench = JESSICA_SCORE_BENCHMARKS[slug];
  if (!bench) return `Score ${score}`;

  const band = bench.bands.find((b) => score <= b.max) ?? bench.bands[bench.bands.length - 1];
  const vsAvg =
    score > bench.average + 2
      ? `au-dessus de la moyenne (${bench.average})`
      : score < bench.average - 2
        ? `sous la moyenne (${bench.average})`
        : `proche de la moyenne (${bench.average})`;

  if (slug === "tdah") {
    return `Score ${score} — ${band.label} · ${vsAvg}`;
  }

  return `Score ${score} — ${band.label} · ${vsAvg}`;
}

export function getJessicaScoreBenchmark(slug: string): JessicaScoreBenchmark | null {
  return JESSICA_SCORE_BENCHMARKS[slug] ?? null;
}

/** Champs Typeform en réponse libre (souvent mal typés en QCM via les réponses CSV). */
export function shouldBeFreeTextQuestion(q: JessicaQuestionDef): boolean {
  const label = q.label.trim();
  const lower = label.toLowerCase();

  if (/^précision\s*\(autre\)/i.test(label)) return true;
  if (/^other$/i.test(label)) return true;
  if (/\bprofession\b/i.test(lower)) return true;
  if (
    /^(nom|prénom|prenom|email|e-mail|téléphone|telephone|âge|age)\b/i.test(lower) ||
    lower.startsWith("nom de") ||
    lower.startsWith("prénom") ||
    lower.startsWith("prenom")
  ) {
    return true;
  }
  if (
    /décrivez|décrire brièvement|précisez|expliquez|centres d'intérêt|journée type|dans quelle école|en quelle classe/i.test(
      lower,
    )
  ) {
    return true;
  }
  return false;
}

/** Corrige les QCM fantômes (ex. professions issues des réponses Typeform). */
export function sanitizeJessicaQuestions(questions: JessicaQuestionDef[]): JessicaQuestionDef[] {
  return questions.map((q) => {
    if (!shouldBeFreeTextQuestion(q)) return q;
    if (q.type === "text" && !q.options?.length) return q;
    return { id: q.id, label: q.label, type: "text" };
  });
}

export function sanitizeJessicaQuestionnaire(
  def: JessicaQuestionnaireDef,
): JessicaQuestionnaireDef {
  return { ...def, questions: sanitizeJessicaQuestions(def.questions) };
}

export function listJessicaQuestionnaires(): JessicaQuestionnaireDef[] {
  return JESSICA_QUESTIONNAIRE_SLUGS.map((slug) =>
    sanitizeJessicaQuestionnaire(JESSICA_QUESTIONNAIRES[slug]),
  );
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
