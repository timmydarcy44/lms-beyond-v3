"use server";

import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";

export async function submitQuestionnaireResponses(
  questionnaireId: string,
  responses: Record<string, any>
) {
  const supabase = await getServerClient();
  if (!supabase) {
    throw new Error("Supabase non configuré");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  // Récupérer l'organisation de l'utilisateur
  const { data: membership } = await supabase
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    throw new Error("Utilisateur non associé à une organisation");
  }

  // Insérer les réponses
  const responsesToInsert = Object.entries(responses).map(([questionId, responseValue]) => {
    const responseData = Array.isArray(responseValue)
      ? { selected: responseValue }
      : typeof responseValue === "object"
      ? responseValue
      : { value: responseValue };

    return {
      questionnaire_id: questionnaireId,
      question_id: questionId,
      user_id: user.id,
      org_id: membership.org_id,
      response_value: typeof responseValue === "string" ? responseValue : JSON.stringify(responseValue),
      response_data: responseData,
    };
  });

  const { error: insertError } = await supabase
    .from("mental_health_responses")
    .upsert(responsesToInsert, {
      onConflict: "questionnaire_id,question_id,user_id",
    });

  if (insertError) {
    console.error("[questionnaire/actions] Error inserting responses:", insertError);
    throw new Error("Erreur lors de l'enregistrement des réponses");
  }

  // Calculer et enregistrer le score
  try {
    const responsesForScoring = Object.entries(responses).map(([questionId, responseValue]) => ({
      question_id: questionId,
      response_value: responseValue,
      response_data: Array.isArray(responseValue)
        ? { selected: responseValue }
        : typeof responseValue === "object"
        ? responseValue
        : { value: responseValue },
    }));

    const scoreResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mental-health/calculate-score`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaire_id: questionnaireId,
          responses: responsesForScoring,
        }),
      }
    );

    if (scoreResponse.ok) {
      const scoreData = await scoreResponse.json();
      console.log("[questionnaire/actions] Score calculated:", scoreData);
    }
  } catch (scoreError) {
    console.error("[questionnaire/actions] Error calculating score:", scoreError);
    // Ne pas bloquer la redirection si le calcul de score échoue
  }

  redirect("/dashboard/apprenant/sante-mentale");
}

