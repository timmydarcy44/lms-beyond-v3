import type { TestCategoryResult } from "@/types/test-result";

export type LearnerSkillInsight = {
  category: string;
  averagePercent: number;
  sampleCount: number;
  source: "catalog_test" | "quiz" | "mental_health" | "edge_mission";
};

export type LearnerDossierTestAttempt = {
  id: string;
  testId: string;
  testTitle: string;
  completedAt: string;
  attemptIndex: number;
  totalAttemptsForTest: number;
  percentage: number | null;
  score: number | null;
  maxScore: number | null;
  categoryResults: TestCategoryResult[];
  analysis: string | null;
};

export type LearnerCourseEngagement = {
  courseId: string;
  courseTitle: string | null;
  progressPercent: number | null;
  lastAccessedAt: string | null;
  enrolledAt: string | null;
  totalTimeSeconds: number;
  activeTimeSeconds: number;
  sessionCount: number;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
};

export type LearnerFlashcardSession = {
  id: string;
  courseId: string | null;
  scopeId: string;
  courseTitle: string | null;
  totalCards: number;
  knownCount: number;
  unknownCount: number;
  knownPercent: number;
  durationSeconds: number;
  completedAt: string;
};

export type LearnerInterviewSession = {
  id: string;
  courseId: string | null;
  lessonId: string;
  interviewStyle: "coaching" | "experiential";
  chapterTitle: string | null;
  courseTitle: string | null;
  status: string;
  userTurnCount: number;
  durationSeconds: number;
  completedAt: string;
  feedback: {
    summary?: string;
    bien_dit?: string[];
    a_revoir?: string[];
    axes_amelioration?: string[];
  } | null;
};

export type LearnerCoachingActivity = {
  id: string;
  type:
    | "accompagnement_reservation"
    | "programme_request"
    | "personalized_path"
    | "edge_mission"
    | "path_trigger"
    | "ai_lesson";
  title: string;
  detail: string | null;
  status: string | null;
  occurredAt: string;
  strengths?: string[];
  improvements?: string[];
};

export type LearnerDossier = {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  totalActiveTimeSeconds: number;
  totalTimeSeconds: number;
  totalTestAttempts: number;
  totalQuizAttempts: number;
  courses: LearnerCourseEngagement[];
  catalogTests: LearnerDossierTestAttempt[];
  quizSummaries: Array<{
    testId: string;
    testTitle: string | null;
    attemptCount: number;
    bestScore: number;
    lastScore: number;
    lastAt: string;
  }>;
  strengths: LearnerSkillInsight[];
  weaknesses: LearnerSkillInsight[];
  coachingActivities: LearnerCoachingActivity[];
  flashcardSessions: LearnerFlashcardSession[];
  interviewSessions: LearnerInterviewSession[];
  profileAnalysis: {
    strengths: string[];
    improvements: string[];
    summary: string | null;
  } | null;
  aiTransformations: Array<{ action: string; count: number }>;
};

export function formatLearnerDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}
