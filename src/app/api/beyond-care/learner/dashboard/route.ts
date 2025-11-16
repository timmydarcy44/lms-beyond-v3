import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { hasUserFeature } from "@/lib/queries/organization-features";

const DIMENSION_LABELS: Record<string, string> = {
  style_cognitif_organisationnel: "Organisation cognitive",
  mode_emotionnel_naturel: "Mode émotionnel naturel",
  besoin_social_naturel: "Besoin social naturel",
  coping_naturel: "Coping naturel",
  energie_rythme_interne: "Énergie & rythme interne",
  gestion_emotions_stress: "Gestion des émotions & du stress",
  communication_influence: "Communication & influence",
  perseverance_action: "Persévérance & passage à l’action",
  organisation_priorites: "Organisation, temps & priorités",
  empathie_ecoute_active: "Empathie & écoute active",
  resolution_problemes: "Résolution de problèmes & pensée critique",
  collaboration_conflits: "Collaboration & gestion des conflits",
  creativite_adaptabilite: "Créativité & adaptabilité",
  leadership_vision: "Leadership & vision",
  confiance_decision: "Confiance en soi & prise de décision",
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier l'accès
    const hasAccess = await hasUserFeature("beyond_care");
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Récupérer les indicateurs de santé mentale de l'utilisateur
    const { data: indicators } = await supabase
      .from("mental_health_indicators")
      .select("*")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false });

    // Récupérer les réponses de l'utilisateur
    const { data: responses } = await supabase
      .from("mental_health_responses")
      .select("questionnaire_id, created_at")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false });

    // Récupérer l'organisation pour trouver les questionnaires actifs
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", session.id)
      .limit(1)
      .single();

    let nextQuestionnaireDate: string | null = null;
    let pendingQuestionnaires = 0;

    if (membership) {
      const { data: questionnaires } = await supabase
        .from("mental_health_questionnaires")
        .select("id, frequency, send_day, send_time")
        .eq("org_id", membership.org_id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (questionnaires) {
        // Calculer la date du prochain questionnaire
        const now = new Date();
        const nextDate = new Date(now);
        
        if (questionnaires.frequency === "weekly") {
          nextDate.setDate(now.getDate() + (7 - now.getDay() + questionnaires.send_day) % 7);
        } else if (questionnaires.frequency === "biweekly") {
          nextDate.setDate(now.getDate() + 14);
        } else {
          nextDate.setMonth(now.getMonth() + 1);
        }
        
        nextQuestionnaireDate = nextDate.toISOString();

        // Compter les questionnaires en attente
        const { count } = await supabase
          .from("mental_health_notifications")
          .select("*", { count: "exact", head: true })
          .eq("questionnaire_id", questionnaires.id)
          .eq("user_id", session.id)
          .is("completed_at", null);

        pendingQuestionnaires = count || 0;
      }
    }

    const { data: assessments } = await supabase
      .from("mental_health_assessments")
      .select("id, questionnaire_id, overall_score, dimension_scores, analysis_summary, analysis_details, metadata, created_at")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false });

    const latestAssessment = assessments?.[0] ?? null;

    let overallScore: number | null = null;
    if (latestAssessment) {
      overallScore = latestAssessment.overall_score;
    } else if (indicators?.length) {
      const latestIndicator = indicators[0];
      overallScore = (latestIndicator.stress_score + latestIndicator.wellbeing_score + latestIndicator.motivation_score) / 3;
    }

    let scoreTrend: "up" | "down" | "stable" = "stable";
    if (assessments && assessments.length >= 2) {
      const current = assessments[0].overall_score;
      const previous = assessments[1].overall_score;
      if (current > previous + 5) scoreTrend = "up";
      else if (current < previous - 5) scoreTrend = "down";
    } else if (indicators && indicators.length >= 2) {
      const current =
        (indicators[0].stress_score + indicators[0].wellbeing_score + indicators[0].motivation_score) / 3;
      const previous =
        (indicators[1].stress_score + indicators[1].wellbeing_score + indicators[1].motivation_score) / 3;
      if (current > previous + 5) scoreTrend = "up";
      else if (current < previous - 5) scoreTrend = "down";
    }

    const recentScores = (assessments ?? []).slice(0, 10).map((assessment) => ({
      date: assessment.created_at,
      score: assessment.overall_score,
    }));

    const dimensionBreakdown = latestAssessment
      ? Object.entries(latestAssessment.dimension_scores ?? {}).map(([key, value]) => {
          const detail = latestAssessment.analysis_details?.[key] as
            | { message?: string; recommendations?: string[] }
            | undefined;
          return {
            key,
            label: DIMENSION_LABELS[key] ?? key,
            score: value as number,
            message: detail?.message ?? null,
            recommendations: Array.isArray(detail?.recommendations) ? detail?.recommendations : [],
          };
        })
      : [];

    const indicatorsPayload =
      latestAssessment?.dimension_scores != null
        ? {
            stress: Math.round((latestAssessment.dimension_scores as Record<string, number>).coping_naturel ?? 0),
            wellbeing: Math.round(
              (latestAssessment.dimension_scores as Record<string, number>).mode_emotionnel_naturel ?? 0,
            ),
            motivation: Math.round(
              (latestAssessment.dimension_scores as Record<string, number>).energie_rythme_interne ?? 0,
            ),
          }
        : {
            stress: indicators?.[0]?.stress_score ?? 0,
            wellbeing: indicators?.[0]?.wellbeing_score ?? 0,
            motivation: indicators?.[0]?.motivation_score ?? 0,
          };

    return NextResponse.json({
      overallScore,
      scoreTrend,
      nextQuestionnaireDate,
      indicators: indicatorsPayload,
      recentScores,
      completedQuestionnaires: assessments?.length ?? responses?.length ?? 0,
      pendingQuestionnaires,
      latestAssessment,
      assessmentHistory: assessments ?? [],
      dimensionBreakdown,
    });
  } catch (error) {
    console.error("[beyond-care/learner/dashboard] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}


