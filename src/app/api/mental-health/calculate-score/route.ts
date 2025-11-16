import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { calculateQuestionnaireScore, interpretMentalHealthScore } from "@/lib/mental-health/scoring";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { questionnaire_id, responses } = body;

    if (!questionnaire_id || !responses) {
      return NextResponse.json(
        { error: "questionnaire_id et responses sont requis" },
        { status: 400 }
      );
    }

    // Récupérer le questionnaire avec ses questions et la config de scoring
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from("mental_health_questionnaires")
      .select(`
        *,
        questions:mental_health_questions(*)
      `)
      .eq("id", questionnaire_id)
      .single();

    if (questionnaireError || !questionnaire) {
      return NextResponse.json(
        { error: "Questionnaire non trouvé" },
        { status: 404 }
      );
    }

    // Calculer le score
    const scoreResult = calculateQuestionnaireScore(
      responses,
      questionnaire.questions || [],
      questionnaire.scoring_config
    );

    // Interpréter le score
    const interpretation = interpretMentalHealthScore(scoreResult.percentage);

    // Enregistrer l'indicateur dans la base de données
    const weekStart = getWeekStartDate(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Récupérer l'organisation de l'utilisateur
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (membership) {
      // Enregistrer l'indicateur global
      await supabase
        .from("mental_health_indicators")
        .upsert({
          user_id: user.id,
          org_id: membership.org_id,
          questionnaire_id: questionnaire_id,
          indicator_type: "overall_wellbeing",
          indicator_value: scoreResult.percentage,
          indicator_label: interpretation.label,
          week_start_date: weekStart.toISOString().split("T")[0],
          week_end_date: weekEnd.toISOString().split("T")[0],
        }, {
          onConflict: "user_id,indicator_type,week_start_date",
        });

      // Enregistrer les indicateurs par catégorie si disponibles
      if (scoreResult.categoryScores) {
        for (const [categoryName, categoryScore] of Object.entries(scoreResult.categoryScores)) {
          await supabase
            .from("mental_health_indicators")
            .upsert({
              user_id: user.id,
              org_id: membership.org_id,
              questionnaire_id: questionnaire_id,
              indicator_type: categoryName.toLowerCase().replace(/\s+/g, "_"),
              indicator_value: categoryScore.percentage,
              indicator_label: categoryName,
              week_start_date: weekStart.toISOString().split("T")[0],
              week_end_date: weekEnd.toISOString().split("T")[0],
            }, {
              onConflict: "user_id,indicator_type,week_start_date",
            });
        }
      }
    }

    return NextResponse.json({
      score: scoreResult,
      interpretation,
    });
  } catch (error) {
    console.error("[mental-health/calculate-score] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}

function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi = 0
  return new Date(d.setDate(diff));
}



