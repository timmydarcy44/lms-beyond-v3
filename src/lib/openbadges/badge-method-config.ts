import {
  BADGE_EVALUATION_METHODS,
  PLAYGROUND_DEFAULT_MAX_ATTEMPTS,
  type BadgeEvaluationMethodId,
  isBadgeEvaluationMethodId,
} from "@/lib/openbadges/badge-evaluation";
import { validateQcmQuestions } from "@/lib/openbadges/qcm-question-validation";

export type QcmChoice = {
  id: string;
  label: string;
  isCorrect: boolean;
};

export type EvaluationQuestionType = "single" | "multiple" | "text";

export type QcmQuestion = {
  id: string;
  prompt: string;
  choices: QcmChoice[];
  /** single = choix unique, multiple = cases à cocher, text = réponse libre */
  questionType?: EvaluationQuestionType;
};

export type QcmGenerationMode = "scratch" | "ai";

export type BadgeMethodConfig = {
  methodId: BadgeEvaluationMethodId;
  /** Consigne d'évaluation IA / critères (hors QCM structuré). */
  evaluationPrompt: string;
  /** Playground EDGE : consigne affichée + nombre d'essais. */
  playground?: {
    /** Consigne visible par l'apprenant en haut du chat. */
    learnerPrompt: string;
    maxAttempts: number;
  };
  /** Étude de cas : contexte + consigne apprenant (interface type Drive). */
  caseStudy?: {
    /** Mise en situation affichée à l'apprenant (optionnel). */
    context?: string;
    /** Consigne / brief mission affiché à l'apprenant. */
    learnerPrompt: string;
  };
  /** QCM uniquement. */
  quiz?: {
    generationMode?: QcmGenerationMode;
    questionCount?: number;
    /** Pourcentage minimum de bonnes réponses (1–100). Défaut : 100. */
    passingScorePercent?: number;
    title?: string;
    level?: number;
    questions: QcmQuestion[];
  };
};

export function getCaseStudyLearnerPrompt(config: BadgeMethodConfig): string {
  const cs = config.caseStudy;
  if (!cs) return "";
  return String(cs.learnerPrompt ?? (cs as { consigne?: string }).consigne ?? "").trim();
}

export function getCaseStudyContext(config: BadgeMethodConfig): string {
  return String(config.caseStudy?.context ?? "").trim();
}

/** Valeur brute du seuil QCM (nombre ou chaîne « 60 ») → entier 1–100, sinon null. */
export function coerceQcmPassingScorePercent(raw: unknown): number | null {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim()
        ? Number.parseInt(raw.trim(), 10)
        : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(1, Math.round(n)));
}

export function hasExplicitQcmPassingScore(config: BadgeMethodConfig): boolean {
  return coerceQcmPassingScorePercent(config.quiz?.passingScorePercent) != null;
}

export function getQcmPassingScorePercent(config: BadgeMethodConfig): number {
  return coerceQcmPassingScorePercent(config.quiz?.passingScorePercent) ?? 100;
}

/** Conserve le seuil QCM depuis le JSON brut si le parse l’a omis. */
export function enrichMethodConfigsFromRaw(
  parsed: BadgeMethodConfig[],
  raw: unknown,
): BadgeMethodConfig[] {
  if (!Array.isArray(raw) || parsed.length === 0) return parsed;
  return parsed.map((config) => {
    if (config.methodId !== "qcm") return config;
    const rawItem = raw.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as { methodId?: string }).methodId === "qcm",
    ) as { quiz?: Record<string, unknown> } | undefined;
    const fromRaw = coerceQcmPassingScorePercent(rawItem?.quiz?.passingScorePercent);
    const fromParsed = coerceQcmPassingScorePercent(config.quiz?.passingScorePercent);
    const passingScorePercent = fromParsed ?? fromRaw;
    if (passingScorePercent == null) return config;
    return {
      ...config,
      quiz: {
        ...(config.quiz ?? { questions: [] }),
        passingScorePercent,
      },
    };
  });
}

/** Garantit des id uniques pour questions et choix (évite clés React dupliquées « 1 », « 2 », …). */
export function ensureUniqueQcmIds(questions: QcmQuestion[]): QcmQuestion[] {
  const seenQuestionIds = new Set<string>();
  const seenChoiceIds = new Set<string>();

  return questions.map((q) => {
    let questionId = String(q.id ?? "").trim();
    if (!questionId || seenQuestionIds.has(questionId)) {
      questionId = crypto.randomUUID();
    }
    seenQuestionIds.add(questionId);

    const choices = (q.choices ?? []).map((c) => {
      let choiceId = String(c.id ?? "").trim();
      if (!choiceId || seenChoiceIds.has(choiceId)) {
        choiceId = crypto.randomUUID();
      }
      seenChoiceIds.add(choiceId);
      return { ...c, id: choiceId };
    });

    return { ...q, id: questionId, choices };
  });
}

export function createEmptyQcmQuestion(): QcmQuestion {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    questionType: "single",
    choices: [
      { id: crypto.randomUUID(), label: "", isCorrect: true },
      { id: crypto.randomUUID(), label: "", isCorrect: false },
    ],
  };
}

export function defaultMethodConfig(methodId: BadgeEvaluationMethodId): BadgeMethodConfig {
  return {
    methodId,
    evaluationPrompt: "",
    ...(methodId === "qcm"
      ? {
          quiz: {
            generationMode: "ai" as QcmGenerationMode,
            questionCount: 5,
            passingScorePercent: 100,
            questions: [],
          },
        }
      : {}),
    ...(methodId === "playground"
      ? {
          playground: {
            learnerPrompt: "",
            maxAttempts: PLAYGROUND_DEFAULT_MAX_ATTEMPTS,
          },
        }
      : {}),
    ...(methodId === "case_study"
      ? {
          caseStudy: {
            context: "",
            learnerPrompt: "",
          },
        }
      : {}),
  };
}

const METHOD_LABELS = Object.fromEntries(
  BADGE_EVALUATION_METHODS.map((m) => [m.id, m.label]),
) as Record<BadgeEvaluationMethodId, string>;

export function methodConfigLabel(methodId: BadgeEvaluationMethodId): string {
  if (methodId === "qcm") return "Évaluation";
  return METHOD_LABELS[methodId] ?? methodId;
}

export function validateMethodConfig(config: BadgeMethodConfig): string | null {
  if (!isBadgeEvaluationMethodId(config.methodId)) {
    return "Méthode invalide.";
  }

  if (config.methodId === "qcm") {
    const quiz = config.quiz;
    const questionCount = quiz?.questionCount ?? 0;
    if (!Number.isInteger(questionCount) || questionCount < 1) {
      return "Indiquez le nombre de questions à réaliser (minimum 1).";
    }

    const mode = quiz?.generationMode ?? "ai";

    if (mode === "ai" && !config.evaluationPrompt.trim()) {
      return "Rédigez la directive pour la génération des questions par l’IA.";
    }

    return validateQcmQuestions(quiz?.questions ?? []);
  }

  if (config.methodId === "case_study") {
    if (!getCaseStudyLearnerPrompt(config)) {
      return "Rédigez la consigne affichée à l'apprenant (étude de cas).";
    }
    if (!config.evaluationPrompt.trim()) {
      return "Rédigez le prompt d'évaluation IA (analyse de l'étude de cas).";
    }
    return null;
  }

  if (config.methodId === "playground") {
    const pg = config.playground;
    if (!pg?.learnerPrompt?.trim()) {
      return "Rédigez la consigne affichée à l'apprenant dans le Playground.";
    }
    const max = pg.maxAttempts ?? PLAYGROUND_DEFAULT_MAX_ATTEMPTS;
    if (!Number.isInteger(max) || max < 1 || max > 5) {
      return "Nombre d'essais : entre 1 et 5.";
    }
    if (!config.evaluationPrompt.trim()) {
      return "Rédigez le prompt d'évaluation IA (analyse des réponses Playground).";
    }
    return null;
  }

  if (!config.evaluationPrompt.trim()) {
    switch (config.methodId) {
      case "dictation":
        return "Rédigez le prompt d’analyse des propos de l’apprenant.";
      case "video":
        return "Rédigez le prompt d’évaluation de la vidéo.";
      case "pdf_upload":
        return "Rédigez le prompt d’évaluation du document.";
      default:
        return "Consigne d’évaluation requise.";
    }
  }

  return null;
}

export function validateMethodConfigsForMethods(
  methodIds: string[],
  configs: BadgeMethodConfig[],
): string | null {
  for (const methodId of methodIds) {
    if (!isBadgeEvaluationMethodId(methodId)) continue;
    const config = configs.find((c) => c.methodId === methodId);
    if (!config) {
      return `Configurez la méthode « ${methodConfigLabel(methodId)} ».`;
    }
    const err = validateMethodConfig(config);
    if (err) return `${methodConfigLabel(methodId)} : ${err}`;
  }
  return null;
}

/** Prompt agrégé (legacy `aiEvaluationPrompt` / évaluation IA). */
export function buildAggregatedEvaluationPrompt(configs: BadgeMethodConfig[]): string {
  return configs
    .map((c) => {
      const label = methodConfigLabel(c.methodId);
      if (c.methodId === "qcm" && c.quiz) {
        const mode = c.quiz.generationMode ?? "ai";
        const count = c.quiz.questionCount ?? c.quiz.questions?.length ?? 0;
        const title = c.quiz.title?.trim();
        const level = c.quiz.level;
        const header = [
          title ? `Titre QCM : ${title}` : null,
          level != null ? `Niveau : ${level}` : null,
          `Nombre de questions : ${count}`,
          `Mode : ${mode === "ai" ? "génération IA" : "saisie manuelle"}`,
        ]
          .filter(Boolean)
          .join("\n");

        if (mode === "ai") {
          return `## ${label}\n${header}\n\nDirective IA :\n${c.evaluationPrompt.trim()}`;
        }

        const qcmText = (c.quiz.questions ?? [])
          .map((q, i) => {
            const correct = q.choices.find((ch) => ch.isCorrect)?.label ?? "?";
            return `Q${i + 1}: ${q.prompt}\nBonne réponse: ${correct}`;
          })
          .join("\n");
        return `## ${label}\n${header}\n${c.evaluationPrompt.trim() ? `\n${c.evaluationPrompt.trim()}\n` : ""}\nQuestions:\n${qcmText}`;
      }
      if (c.methodId === "playground" && c.playground) {
        return `## ${label}\nConsigne apprenant : ${c.playground.learnerPrompt.trim()}\nEssais max : ${c.playground.maxAttempts}\n\nÉvaluation IA :\n${c.evaluationPrompt.trim()}`;
      }
      if (c.methodId === "case_study" && c.caseStudy) {
        const ctx = getCaseStudyContext(c);
        const consigne = getCaseStudyLearnerPrompt(c);
        return `## ${label}\n${ctx ? `Contexte :\n${ctx}\n\n` : ""}Consigne apprenant :\n${consigne}\n\nÉvaluation IA (confidentiel) :\n${c.evaluationPrompt.trim()}`;
      }
      return `## ${label}\n${c.evaluationPrompt.trim()}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export function parseMethodConfigs(raw: unknown): BadgeMethodConfig[] {
  if (!Array.isArray(raw)) return [];
  const out: BadgeMethodConfig[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const methodId = (item as { methodId?: string }).methodId;
    if (!isBadgeEvaluationMethodId(methodId)) continue;
    const evaluationPrompt =
      typeof (item as { evaluationPrompt?: string }).evaluationPrompt === "string"
        ? (item as { evaluationPrompt: string }).evaluationPrompt
        : "";
    const quizRaw = (item as { quiz?: Record<string, unknown> }).quiz;
    let quiz: BadgeMethodConfig["quiz"];
    if (methodId === "qcm" && quizRaw && typeof quizRaw === "object") {
      const generationMode =
        quizRaw.generationMode === "scratch" || quizRaw.generationMode === "ai"
          ? quizRaw.generationMode
          : undefined;
      const questionCount =
        typeof quizRaw.questionCount === "number" ? quizRaw.questionCount : undefined;
      const passingScorePercent = coerceQcmPassingScorePercent(quizRaw.passingScorePercent) ?? undefined;
      const title = typeof quizRaw.title === "string" ? quizRaw.title : undefined;
      const level = typeof quizRaw.level === "number" ? quizRaw.level : undefined;
      const questionsRaw = quizRaw.questions;
      quiz = {
        ...(generationMode ? { generationMode } : {}),
        ...(questionCount != null ? { questionCount } : {}),
        ...(passingScorePercent != null ? { passingScorePercent } : {}),
        ...(title ? { title } : {}),
        ...(level != null ? { level } : {}),
        questions: Array.isArray(questionsRaw)
          ? ensureUniqueQcmIds(
              questionsRaw
                .filter((q): q is QcmQuestion => Boolean(q && typeof q === "object"))
                .map((q) => {
                  const rawType = (q as QcmQuestion).questionType;
                  const questionType =
                    rawType === "multiple" || rawType === "text" || rawType === "single"
                      ? rawType
                      : "single";
                  return {
                    id: String((q as QcmQuestion).id ?? crypto.randomUUID()),
                    prompt: String((q as QcmQuestion).prompt ?? ""),
                    questionType,
                    choices: Array.isArray((q as QcmQuestion).choices)
                      ? (q as QcmQuestion).choices.map((c) => ({
                          id: String(c.id ?? crypto.randomUUID()),
                          label: String(c.label ?? ""),
                          isCorrect: Boolean(c.isCorrect),
                        }))
                      : [],
                  };
                }),
            )
          : [],
      };
    }
    const csRaw = (item as { caseStudy?: Record<string, unknown> }).caseStudy;
    let caseStudy: BadgeMethodConfig["caseStudy"];
    if (methodId === "case_study" && csRaw && typeof csRaw === "object") {
      caseStudy = {
        context: typeof csRaw.context === "string" ? csRaw.context : "",
        learnerPrompt:
          typeof csRaw.learnerPrompt === "string"
            ? csRaw.learnerPrompt
            : typeof csRaw.consigne === "string"
              ? csRaw.consigne
              : "",
      };
    }
    const pgRaw = (item as { playground?: Record<string, unknown> }).playground;
    let playground: BadgeMethodConfig["playground"];
    if (methodId === "playground" && pgRaw && typeof pgRaw === "object") {
      playground = {
        learnerPrompt:
          typeof pgRaw.learnerPrompt === "string"
            ? pgRaw.learnerPrompt
            : typeof pgRaw.consigne === "string"
              ? pgRaw.consigne
              : "",
        maxAttempts:
          typeof pgRaw.maxAttempts === "number"
            ? pgRaw.maxAttempts
            : PLAYGROUND_DEFAULT_MAX_ATTEMPTS,
      };
    }
    out.push({
      methodId,
      evaluationPrompt,
      ...(quiz ? { quiz } : {}),
      ...(playground ? { playground } : {}),
      ...(caseStudy ? { caseStudy } : {}),
    });
  }
  return out;
}

export function getPlaygroundMaxAttempts(config: BadgeMethodConfig): number {
  return config.playground?.maxAttempts ?? PLAYGROUND_DEFAULT_MAX_ATTEMPTS;
}

/** Résout les configs d'épreuve depuis un badge (receivability + fallback evaluationMethods). */
export function resolveMethodConfigsForBadge(badgeRow: Record<string, unknown>): BadgeMethodConfig[] {
  const receivability = badgeRow.receivability as Record<string, unknown> | undefined;
  const methodOrder = Array.isArray(badgeRow.evaluationMethods)
    ? badgeRow.evaluationMethods.map((id) => String(id))
    : [];

  let configs = enrichMethodConfigsFromRaw(
    parseMethodConfigs(receivability?.methodConfigs),
    receivability?.methodConfigs,
  );
  if (configs.length === 0) {
    configs = enrichMethodConfigsFromRaw(
      parseMethodConfigs(badgeRow.methodConfigs),
      badgeRow.methodConfigs,
    );
  }
  if (configs.length === 0) {
    configs = methodOrder
      .filter(isBadgeEvaluationMethodId)
      .map((methodId) => defaultMethodConfig(methodId));
  }

  if (methodOrder.length > 0) {
    configs.sort((a, b) => {
      const ia = methodOrder.indexOf(a.methodId);
      const ib = methodOrder.indexOf(b.methodId);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }

  const qcm = configs.find((c) => c.methodId === "qcm");
  const playground = configs.find((c) => c.methodId === "playground");
  const middle = configs.filter((c) => c.methodId !== "qcm" && c.methodId !== "playground");
  const ordered: BadgeMethodConfig[] = [];
  if (qcm) ordered.push(qcm);
  ordered.push(...middle);
  if (playground) ordered.push(playground);

  return ordered.length > 0 ? ordered : configs;
}
