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

  const isSuper = await isSuperAdmin();
  const sessionClient = await getServerClient();
  
  // Pour les super admins, permettre l'accès même sans session client
  if (!sessionClient && !isSuper) {
    redirect("/dashboard");
  }

  const {
    data: { user },
  } = sessionClient ? await sessionClient.auth.getUser() : { data: { user: null } };

  // Pour les super admins, permettre l'accès même sans user
  if (!user?.id && !isSuper) {
    redirect("/dashboard");
  }

  // Utiliser le service role client pour les super admins, sinon le session client
  const queryClient = isSuper ? (getServiceRoleClient() ?? sessionClient) : (sessionClient!);

  if (!queryClient) {
    redirect("/dashboard");
  }

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

  const { data: assessments } = user?.id ? await queryClient
    .from("mental_health_assessments")
    .select("id, questionnaire_id, overall_score, dimension_scores, analysis_summary, analysis_details, metadata, created_at")
    .eq("questionnaire_id", questionnaireId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) : { data: [] };

  // Récupérer l'ID de Jessica Contentin et Tim Darcy pour déterminer si c'est leur test
  const { data: jessicaProfile } = await queryClient
    .from("profiles")
    .select("id, email")
    .eq("email", "contentin.cabinet@gmail.com")
    .maybeSingle();

  const { data: timDarcyProfile } = await queryClient
    .from("profiles")
    .select("id, email")
    .eq("email", "timdarcypro@gmail.com")
    .maybeSingle();

  // Vérifier si le questionnaire appartient à Jessica ou Tim Darcy (par created_by ou par email du créateur)
  let isJessicaQuestionnaire = false;
  let isTimDarcyQuestionnaire = false;
  console.log("[questionnaire] Checking if questionnaire belongs to Jessica or Tim Darcy:", {
    questionnaireId: questionnaire.id,
    questionnaireTitle: questionnaire.title,
    createdBy: questionnaire.created_by,
    jessicaProfileId: jessicaProfile?.id,
    jessicaEmail: jessicaProfile?.email,
    timDarcyProfileId: timDarcyProfile?.id,
    timDarcyEmail: timDarcyProfile?.email,
  });
  
  // Vérifier d'abord par created_by
  if (jessicaProfile?.id && questionnaire.created_by === jessicaProfile.id) {
    isJessicaQuestionnaire = true;
    console.log("[questionnaire] ✅ Detected as Jessica's questionnaire by created_by match");
  } else if (timDarcyProfile?.id && questionnaire.created_by === timDarcyProfile.id) {
    isTimDarcyQuestionnaire = true;
    console.log("[questionnaire] ✅ Detected as Tim Darcy's questionnaire by created_by match");
  } else if (questionnaire.created_by) {
    // Vérifier aussi par l'email du créateur au cas où
    const { data: creatorProfile } = await queryClient
      .from("profiles")
      .select("email")
      .eq("id", questionnaire.created_by)
      .maybeSingle();
    
    console.log("[questionnaire] Creator profile:", {
      creatorId: questionnaire.created_by,
      creatorEmail: creatorProfile?.email,
    });
    
    isJessicaQuestionnaire = creatorProfile?.email === "contentin.cabinet@gmail.com";
    isTimDarcyQuestionnaire = creatorProfile?.email === "timdarcypro@gmail.com";
    
    if (isJessicaQuestionnaire) {
      console.log("[questionnaire] ✅ Detected as Jessica's questionnaire by creator email");
    } else if (isTimDarcyQuestionnaire) {
      console.log("[questionnaire] ✅ Detected as Tim Darcy's questionnaire by creator email");
    } else {
      console.log("[questionnaire] ❌ Not Jessica's or Tim Darcy's questionnaire by creator email");
    }
  } else {
    console.log("[questionnaire] ❌ No created_by field, cannot determine owner");
  }
  
  // Fallback: Si le titre contient "Soft Skills" et qu'on est sur le site de Jessica, considérer comme Jessica
  // (pour le test Soft Skills qui pourrait être partagé)
  if (!isJessicaQuestionnaire && questionnaire.title?.toLowerCase().includes("soft skills")) {
    // Vérifier si l'utilisateur actuel est Jessica ou si on est dans un contexte Jessica
    if (user?.id === jessicaProfile?.id) {
      isJessicaQuestionnaire = true;
      console.log("[questionnaire] ✅ Detected as Jessica's questionnaire by title + user match");
    }
  }
  
  console.log("[questionnaire] Final isJessicaQuestionnaire:", isJessicaQuestionnaire);
  console.log("[questionnaire] Final isTimDarcyQuestionnaire:", isTimDarcyQuestionnaire);
  console.log("[questionnaire] Questionnaire details:", {
    id: questionnaire.id,
    title: questionnaire.title,
    created_by: questionnaire.created_by,
    timDarcyProfileId: timDarcyProfile?.id,
    jessicaProfileId: jessicaProfile?.id,
  });

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
      isTimDarcy={isTimDarcyQuestionnaire ?? false}
    />
  );
}

