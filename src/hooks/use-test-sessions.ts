import { create } from "zustand";

export type TestAnswerValue = string | string[] | number | null;

export type TestQuestion = {
  id: string;
  type: "single" | "multiple" | "scale" | "text";
  title: string;
  /** Réponse attendue (scoring / admin) — mappée depuis correct_option, correct, etc. */
  correct_answer?: string | number | string[] | null;
  /** Domaine / axe pour le radar (ex. Logistique, Sécurité) */
  category?: string;
  /** Explication affichée si la réponse est incorrecte (« Pourquoi ») */
  explanation_wrong?: string;
  /** Feedback court (optionnel) */
  feedback?: string;
  /** URL absolue d’illustration si déjà connue */
  imageUrl?: string;
  /** Mots-clés pour image placeholder (ex. unsplash) */
  image_keyword?: string;
  helper?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  scale?: {
    min: number;
    max: number;
    step?: number;
    leftLabel?: string;
    rightLabel?: string;
  };
};

export type TestSession = {
  slug: string;
  title: string;
  startedAt: Date;
  completedAt?: Date;
  totalQuestions: number;
  answers: Record<string, TestAnswerValue>;
  score?: number;
};

export type CompletedTest = Pick<TestSession, "slug" | "title" | "answers" | "score"> & {
  startedAt: Date;
  completedAt: Date;
  totalQuestions: number;
};

type TestSessionsStore = {
  sessions: Record<string, TestSession>;
  history: CompletedTest[];
  startSession: (payload: { slug: string; title: string; totalQuestions: number }) => void;
  recordAnswer: (slug: string, questionId: string, value: TestAnswerValue) => void;
  completeSession: (slug: string, options?: { questions?: TestQuestion[]; overrideScore?: number }) => CompletedTest | null;
  resetSession: (slug: string) => void;
};

function normalizeAnswerToken(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  return String(v).trim();
}

function normalizeTextForSimilarity(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const v0 = new Array<number>(bl + 1);
  const v1 = new Array<number>(bl + 1);
  for (let i = 0; i <= bl; i += 1) v0[i] = i;

  for (let i = 0; i < al; i += 1) {
    v1[0] = i + 1;
    for (let j = 0; j < bl; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= bl; j += 1) v0[j] = v1[j];
  }
  return v1[bl];
}

/** Fuzzy matching text: accepte jusqu'à 20% d'écart (typos). */
export function checkSimilarity(a: string, b: string, tolerance = 0.2): boolean {
  const aa = normalizeTextForSimilarity(String(a ?? ""));
  const bb = normalizeTextForSimilarity(String(b ?? ""));
  if (!aa || !bb) return false;
  if (aa === bb) return true;
  const dist = levenshtein(aa, bb);
  const denom = Math.max(aa.length, bb.length);
  if (denom === 0) return false;
  return dist / denom <= tolerance;
}

/** Comparaison stricte après normalisation string (évite string vs number, objets, etc.). */
export function answerMatchesCorrect(question: TestQuestion, userValue: TestAnswerValue | undefined): boolean {
  const correct = question.correct_answer;
  if (correct === undefined || correct === null) return false;

  if (question.type === "multiple") {
    const expected = Array.isArray(correct)
      ? correct.map(normalizeAnswerToken).sort()
      : [normalizeAnswerToken(correct)];
    const got = Array.isArray(userValue) ? userValue.map(normalizeAnswerToken).sort() : [];
    if (expected.length !== got.length) return false;
    return expected.every((val, i) => val === got[i]);
  }

  if (question.type === "single" || question.type === "scale") {
    return normalizeAnswerToken(userValue) === normalizeAnswerToken(correct);
  }

  if (question.type === "text") {
    return checkSimilarity(normalizeAnswerToken(userValue), normalizeAnswerToken(correct), 0.2);
  }

  return false;
}

/** Pourcentage sur les questions qui ont une bonne réponse définie ; null si aucune. */
export function computeAccuracyScorePercent(
  questions: TestQuestion[],
  answers: Record<string, TestAnswerValue>,
): number | null {
  const graded = questions.filter((q) => q.correct_answer !== undefined && q.correct_answer !== null);
  if (!graded.length) return null;
  let ok = 0;
  for (const q of graded) {
    if (answerMatchesCorrect(q, answers[q.id])) ok += 1;
  }
  return Math.round((ok / graded.length) * 100);
}

const computeScore = (session: TestSession): number => {
  const answeredCount = Object.values(session.answers).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === "number") {
      return !Number.isNaN(value);
    }
    if (typeof value === "string") {
      return value.trim().length > 0;
    }
    return Boolean(value);
  }).length;

  const ratio = session.totalQuestions > 0 ? answeredCount / session.totalQuestions : 0;
  const baseScore = 60 + ratio * 40;
  return Math.min(100, Math.max(45, Math.round(baseScore)));
};

export const useTestSessions = create<TestSessionsStore>((set) => ({
  sessions: {},
  history: [],
  startSession: ({ slug, title, totalQuestions }) =>
    set((state) => {
      const existing = state.sessions[slug];
      if (existing) {
        return {
          sessions: {
            ...state.sessions,
            [slug]: {
              ...existing,
              title,
              totalQuestions,
            },
          },
          history: state.history,
        };
      }

      return {
        sessions: {
          ...state.sessions,
          [slug]: {
            slug,
            title,
            totalQuestions,
            startedAt: new Date(),
            answers: {},
          },
        },
        history: state.history,
      };
    }),
  recordAnswer: (slug, questionId, value) =>
    set((state) => {
      const session = state.sessions[slug];
      if (!session) return state;

      return {
        sessions: {
          ...state.sessions,
          [slug]: {
            ...session,
            answers: {
              ...session.answers,
              [questionId]: value,
            },
          },
        },
        history: state.history,
      };
    }),
  completeSession: (slug, options) => {
    let completed: CompletedTest | null = null;

    set((state) => {
      const session = state.sessions[slug];
      if (!session) return state;

      const completedAt = new Date();
      const accuracy =
        options?.questions?.length ? computeAccuracyScorePercent(options.questions, session.answers) : null;
      const score =
        options?.overrideScore ??
        (accuracy !== null ? accuracy : computeScore(session));

      const updatedSession: TestSession = {
        ...session,
        completedAt,
        score,
      };

      completed = {
        slug,
        title: session.title,
        startedAt: session.startedAt,
        completedAt,
        totalQuestions: session.totalQuestions,
        answers: session.answers,
        score,
      };

      const historyWithoutDuplicate = state.history.filter((item) => !(item.slug === slug && item.startedAt === session.startedAt));

      return {
        sessions: {
          ...state.sessions,
          [slug]: updatedSession,
        },
        history: [completed, ...historyWithoutDuplicate].slice(0, 12),
      };
    });

    return completed;
  },
  resetSession: (slug) =>
    set((state) => {
      const { [slug]: _removed, ...rest } = state.sessions;
      return {
        sessions: rest,
        history: state.history,
      };
    }),
}));

export const __testSessionsInternal = { computeScore };










