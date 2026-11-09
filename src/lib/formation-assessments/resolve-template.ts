import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EVAL_CHAUD_QUESTIONS,
  EVAL_FROID_QUESTIONS,
} from "@/lib/formation-assessments/byound-eval-questions";
import type { AssessmentKind, AssessmentQuestion } from "@/lib/formation-assessments/types";

function fallbackQuestions(kind: string): AssessmentQuestion[] | null {
  if (kind === "eval_chaud") return EVAL_CHAUD_QUESTIONS;
  if (kind === "eval_froid") return EVAL_FROID_QUESTIONS;
  return null;
}

export type ResolvedAssessmentTemplate = {
  id: string;
  kind: AssessmentKind;
  title: string;
  questions: AssessmentQuestion[];
  training_course_id: string | null;
  source: "course" | "global";
};

/** Préfère le gabarit formation si présent, sinon le global (chaud/froid/entreprise). */
export async function resolveAssessmentTemplate(
  service: SupabaseClient,
  params: {
    kind: AssessmentKind | string;
    trainingCourseId?: string | null;
  },
): Promise<ResolvedAssessmentTemplate | null> {
  const kind = String(params.kind);
  const courseId = params.trainingCourseId ? String(params.trainingCourseId) : null;

  if (courseId) {
    const { data: courseTpl } = await service
      .from("formation_assessment_templates")
      .select("id, kind, title, questions, training_course_id")
      .eq("kind", kind)
      .eq("training_course_id", courseId)
      .maybeSingle();
    if (courseTpl) {
      return {
        id: String(courseTpl.id),
        kind: String(courseTpl.kind) as AssessmentKind,
        title: String(courseTpl.title),
        questions: (courseTpl.questions ?? []) as AssessmentQuestion[],
        training_course_id: String(courseTpl.training_course_id),
        source: "course",
      };
    }
  }

  const { data: globalTpl } = await service
    .from("formation_assessment_templates")
    .select("id, kind, title, questions, training_course_id")
    .eq("kind", kind)
    .is("training_course_id", null)
    .maybeSingle();

  // Fallback si colonne absente / anciennes lignes sans null explicite
  if (!globalTpl) {
    const { data: anyTpl } = await service
      .from("formation_assessment_templates")
      .select("id, kind, title, questions, training_course_id")
      .eq("kind", kind)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const fb = fallbackQuestions(kind);
    if (!anyTpl && !fb) return null;
    if (!anyTpl && fb) {
      return {
        id: `fallback-${kind}`,
        kind: kind as AssessmentKind,
        title: kind === "eval_chaud" ? "Évaluation à chaud" : "Évaluation à froid",
        questions: fb,
        training_course_id: null,
        source: "global",
      };
    }
    const dbQ = (anyTpl!.questions ?? []) as AssessmentQuestion[];
    return {
      id: String(anyTpl!.id),
      kind: String(anyTpl!.kind) as AssessmentKind,
      title: String(anyTpl!.title),
      questions: dbQ.length >= 8 || !fb ? dbQ : fb,
      training_course_id: anyTpl!.training_course_id
        ? String(anyTpl!.training_course_id)
        : null,
      source: anyTpl!.training_course_id ? "course" : "global",
    };
  }

  const dbQuestions = (globalTpl.questions ?? []) as AssessmentQuestion[];
  const fallback = fallbackQuestions(kind);
  const questions =
    dbQuestions.length >= 8 || !fallback ? dbQuestions : fallback;

  return {
    id: String(globalTpl.id),
    kind: String(globalTpl.kind) as AssessmentKind,
    title: String(globalTpl.title),
    questions,
    training_course_id: null,
    source: "global",
  };
}

export async function resolveTemplateForDossier(
  service: SupabaseClient,
  params: { dossierId: string; kind: AssessmentKind | string },
): Promise<ResolvedAssessmentTemplate | null> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("training_course_id")
    .eq("id", params.dossierId)
    .maybeSingle();
  return resolveAssessmentTemplate(service, {
    kind: params.kind,
    trainingCourseId: dossier?.training_course_id
      ? String(dossier.training_course_id)
      : null,
  });
}
