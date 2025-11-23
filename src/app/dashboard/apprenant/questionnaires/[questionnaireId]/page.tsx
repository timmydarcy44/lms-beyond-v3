import { redirect } from "next/navigation";

import { MentalHealthQuestionnairePlayer } from "@/components/beyond-care/mental-health-questionnaire-player";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

type QuestionRecord = {
  id: string;
  question_text: string;
  question_type: "likert" | "single_choice" | "multiple_choice" | "text" | "number";
  metadata: Record<string, any> | null;
  likert_scale: {
    min: number;
    max: number;
    labels?: Record<string, string>;
  } | null;
  options?: Array<{ label: string; value: string; points?: number }>;
  order_index: number;
};

export default async function QuestionnairePlayerPage({
  params,
}: {
  params: Promise<{ questionnaireId: string }>;
}) {
  const { questionnaireId } = await params;

  const sessionClient = await getServerClient();
  if (!sessionClient) {
    redirect("/dashboard");
  }

  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user?.id) {
    redirect("/dashboard");
  }

  const isSuper = await isSuperAdmin();
  const queryClient = isSuper ? getServiceRoleClient() ?? sessionClient : sessionClient;

  const { data: questionnaire } = await queryClient
    .from("mental_health_questionnaires")
    .select(
      `
        id,
        title,
        description,
        frequency,
        send_day,
        send_time,
        target_roles,
        created_by,
        questions:mental_health_questions (
          id,
          question_text,
          question_type,
          order_index,
          metadata,
          likert_scale,
          options
        )
      `,
    )
    .eq("id", questionnaireId)
    .maybeSingle();

  if (!questionnaire) {
    redirect("/dashboard");
  }

  const sortedQuestions: QuestionRecord[] = (questionnaire.questions ?? [])
    .sort((a: QuestionRecord, b: QuestionRecord) => a.order_index - b.order_index)
    .map((question: any) => ({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      metadata: question.metadata ?? null,
      likert_scale: question.likert_scale ?? null,
      options: question.options ?? null,
      order_index: question.order_index ?? 0,
    }));

  const { data: assessments } = await queryClient
    .from("mental_health_assessments")
    .select("id, questionnaire_id, overall_score, dimension_scores, analysis_summary, analysis_details, metadata, created_at")
    .eq("questionnaire_id", questionnaireId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Récupérer l'ID de Jessica Contentin pour déterminer si c'est son test
  const { data: jessicaProfile } = await queryClient
    .from("profiles")
    .select("id")
    .eq("email", "contentin.cabinet@gmail.com")
    .maybeSingle();

  const isJessicaQuestionnaire = jessicaProfile?.id && questionnaire.created_by === jessicaProfile.id;

  return (
    <MentalHealthQuestionnairePlayer
      questionnaire={{
        id: questionnaire.id,
        title: questionnaire.title,
        description: questionnaire.description,
        frequency: questionnaire.frequency,
        send_day: questionnaire.send_day,
        send_time: questionnaire.send_time,
        target_roles: questionnaire.target_roles,
        questions: sortedQuestions,
      }}
      assessments={assessments ?? []}
      isJessicaContentin={isJessicaQuestionnaire ?? false}
    />
  );
}

