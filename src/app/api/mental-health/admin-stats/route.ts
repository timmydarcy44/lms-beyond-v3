import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { interpretMentalHealthScore } from "@/lib/mental-health/scoring";

export async function GET(request: NextRequest) {
  try {
    const isSuper = await isSuperAdmin();
    const supabase = isSuper ? getServiceRoleClient() : await getServerClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");
    const questionnaireId = searchParams.get("questionnaire_id");

    // Récupérer l'organisation si non fournie
    let targetOrgId = orgId;
    if (!targetOrgId) {
      const { data: membership } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membership) {
        targetOrgId = membership.org_id;
      }
    }

    if (!targetOrgId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 400 }
      );
    }

    // Récupérer tous les apprenants de l'organisation
    const { data: learners } = await supabase
      .from("org_memberships")
      .select(`
        user_id,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq("org_id", targetOrgId)
      .in("role", ["learner", "student"]);

    const totalLearners = learners?.length || 0;

    // Récupérer les indicateurs de santé mentale
    let indicatorsQuery = supabase
      .from("mental_health_indicators")
      .select("*")
      .eq("org_id", targetOrgId)
      .eq("indicator_type", "overall_wellbeing");

    if (questionnaireId) {
      indicatorsQuery = indicatorsQuery.eq("questionnaire_id", questionnaireId);
    }

    // Récupérer les indicateurs les plus récents par utilisateur
    const { data: allIndicators } = await indicatorsQuery;

    // Grouper par utilisateur et prendre le plus récent
    const latestIndicatorsByUser = new Map<string, any>();
    allIndicators?.forEach((indicator) => {
      const existing = latestIndicatorsByUser.get(indicator.user_id);
      if (!existing || new Date(indicator.calculated_at) > new Date(existing.calculated_at)) {
        latestIndicatorsByUser.set(indicator.user_id, indicator);
      }
    });

    const respondedCount = latestIndicatorsByUser.size;
    const scores = Array.from(latestIndicatorsByUser.values()).map((ind) => ind.indicator_value);

    // Calculer la moyenne
    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Distribution des scores
    const distribution = {
      excellent: 0,
      good: 0,
      moderate: 0,
      poor: 0,
      critical: 0,
    };

    scores.forEach((score) => {
      const interpretation = interpretMentalHealthScore(score);
      distribution[interpretation.level] = (distribution[interpretation.level] || 0) + 1;
    });

    const scoreDistribution = Object.entries(distribution).map(([level, count]) => ({
      level,
      count,
      percentage: respondedCount > 0 ? (count / respondedCount) * 100 : 0,
    }));

    // Récupérer les moyennes par catégorie
    const { data: categoryIndicators } = await supabase
      .from("mental_health_indicators")
      .select("*")
      .eq("org_id", targetOrgId)
      .neq("indicator_type", "overall_wellbeing");

    const categoryAverages: Record<string, number[]> = {};
    categoryIndicators?.forEach((ind) => {
      if (!categoryAverages[ind.indicator_type]) {
        categoryAverages[ind.indicator_type] = [];
      }
      categoryAverages[ind.indicator_type].push(ind.indicator_value);
    });

    const categoryAveragesResult: Record<string, number> = {};
    Object.entries(categoryAverages).forEach(([category, values]) => {
      categoryAveragesResult[category] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    // Générer les alertes
    const alerts = Array.from(latestIndicatorsByUser.entries())
      .map(([userId, indicator]) => {
        const learner = learners?.find((l) => l.user_id === userId);
        const interpretation = interpretMentalHealthScore(indicator.indicator_value);
        
        return {
          learner_id: userId,
          learner_name: (learner?.profiles as any)?.full_name || (learner?.profiles as any)?.email || "Inconnu",
          score: indicator.indicator_value,
          level: interpretation.label,
          needsAttention: interpretation.level === "poor" || interpretation.level === "critical",
        };
      })
      .filter((alert) => alert.needsAttention)
      .sort((a, b) => a.score - b.score); // Trier par score croissant (plus préoccupant en premier)

    return NextResponse.json({
      stats: {
        totalLearners,
        respondedCount,
        averageScore: Math.round(averageScore * 100) / 100,
        scoreDistribution,
        categoryAverages: categoryAveragesResult,
        alerts,
      },
    });
  } catch (error) {
    console.error("[mental-health/admin-stats] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}



