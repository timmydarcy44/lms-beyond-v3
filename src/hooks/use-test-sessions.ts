import { create } from "zustand";

export type TestAnswerValue = string | string[] | number | null;

export type TestQuestion = {
  id: string;
  type: "single" | "multiple" | "scale" | "text";
  title: string;
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
  completeSession: (slug: string, overrideScore?: number) => CompletedTest | null;
  resetSession: (slug: string) => void;
};

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
  completeSession: (slug, overrideScore) => {
    let completed: CompletedTest | null = null;

    set((state) => {
      const session = state.sessions[slug];
      if (!session) return state;

      const completedAt = new Date();
      const score = overrideScore ?? computeScore(session);

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










