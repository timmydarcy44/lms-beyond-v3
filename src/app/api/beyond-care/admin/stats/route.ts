import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
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

    const serviceClient = getServiceRoleClient();
    const dataClient = serviceClient ?? supabase;

    // Récupérer l'organisation de l'utilisateur
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", session.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer tous les apprenants de l'organisation
    const { data: learners } = await dataClient
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", membership.org_id)
      .eq("role", "learner");

    const learnerIds = learners?.map(l => l.user_id) || [];

    const totalLearners = learnerIds.length;

    const { data: profiles } = await dataClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", learnerIds);
    const profileMap = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        {
          name: profile.full_name || profile.email || "Apprenant",
          email: profile.email || "",
        },
      ]),
    );

    const { data: assessmentsData } = await dataClient
      .from("mental_health_assessments")
      .select("user_id, overall_score, dimension_scores, created_at")
      .in("user_id", learnerIds)
      .order("created_at", { ascending: false });

    const perUser = new Map<
      string,
      {
        latest: { overall: number; dimensions: Record<string, number>; createdAt: string };
        previous?: { overall: number; createdAt: string };
      }
    >();

    (assessmentsData ?? []).forEach((entry) => {
      if (!entry?.user_id || entry.overall_score == null) return;
      const existing = perUser.get(entry.user_id);
      const record = {
        overall: Number(entry.overall_score),
        dimensions: (entry.dimension_scores ?? {}) as Record<string, number>,
        createdAt: entry.created_at,
      };
      if (!existing) {
        perUser.set(entry.user_id, { latest: record });
      } else if (!existing.previous) {
        existing.previous = { overall: record.overall, createdAt: record.createdAt };
      }
    });

    let overallTotal = 0;
    let overallCount = 0;
    const dimensionTotals = new Map<string, { sum: number; count: number }>();
    let atRiskLearners = 0;

    perUser.forEach(({ latest }) => {
      overallTotal += latest.overall;
      overallCount += 1;
      if (latest.overall < 45) {
        atRiskLearners += 1;
      }
      Object.entries(latest.dimensions ?? {}).forEach(([key, value]) => {
        const entry = dimensionTotals.get(key) ?? { sum: 0, count: 0 };
        entry.sum += Number(value);
        entry.count += 1;
        dimensionTotals.set(key, entry);
      });
    });

    const averageScore = overallCount > 0 ? overallTotal / overallCount : 0;

    const scoreTrend = (() => {
      let previousTotal = 0;
      let previousCount = 0;
      perUser.forEach(({ previous }) => {
        if (previous) {
          previousTotal += previous.overall;
          previousCount += 1;
        }
      });
      if (previousCount === 0) return "stable";
      const previousAverage = previousTotal / previousCount;
      if (averageScore > previousAverage + 5) return "up";
      if (averageScore < previousAverage - 5) return "down";
      return "stable";
    })();

    const dimensionAverages = Array.from(dimensionTotals.entries()).map(([key, info]) => ({
      key,
      label: DIMENSION_LABELS[key] ?? key,
      average: info.count > 0 ? info.sum / info.count : 0,
    }));

    const alerts = Array.from(perUser.entries())
      .map(([userId, { latest, previous }]) => {
        if (!previous) return null;
        const delta = latest.overall - previous.overall;
        if (delta <= -15) {
          const profile = profileMap.get(userId);
          return {
            userId,
            name: profile?.name ?? "Apprenant",
            email: profile?.email ?? "",
            latestScore: latest.overall,
            previousScore: previous.overall,
            delta,
            createdAt: latest.createdAt,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Compter les questionnaires
    const { data: questionnaires } = await dataClient
      .from("mental_health_questionnaires")
      .select("id")
      .eq("org_id", membership.org_id)
      .eq("is_active", true);

    const questionnaireIds = questionnaires?.map(q => q.id) || [];

    const { count: completedCount } = await dataClient
      .from("mental_health_responses")
      .select("*", { count: "exact", head: true })
      .in("questionnaire_id", questionnaireIds)
      .in("user_id", learnerIds);

    const { count: pendingCount } = await dataClient
      .from("mental_health_notifications")
      .select("*", { count: "exact", head: true })
      .in("questionnaire_id", questionnaireIds)
      .in("user_id", learnerIds)
      .is("completed_at", null);

    // ============================================
    // CALCUL DES MOYENNES HEBDOMADAIRES ET MENSUELLES
    // ============================================
    
    // Récupérer les indicateurs de la semaine en cours et des 4 dernières semaines
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Début de la semaine (dimanche)
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    const lastMonthStart = new Date(now);
    lastMonthStart.setMonth(now.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    // Récupérer les indicateurs de cette semaine
    const { data: currentWeekIndicators } = await dataClient
      .from("mental_health_indicators")
      .select("indicator_type, indicator_value, user_id")
      .in("user_id", learnerIds)
      .gte("week_start_date", currentWeekStart.toISOString().split('T')[0])
      .lte("week_start_date", now.toISOString().split('T')[0]);

    // Récupérer les indicateurs de la semaine dernière
    const { data: lastWeekIndicators } = await dataClient
      .from("mental_health_indicators")
      .select("indicator_type, indicator_value, user_id")
      .in("user_id", learnerIds)
      .gte("week_start_date", lastWeekStart.toISOString().split('T')[0])
      .lt("week_start_date", currentWeekStart.toISOString().split('T')[0]);

    // Récupérer les indicateurs du mois dernier
    const { data: lastMonthIndicators } = await dataClient
      .from("mental_health_indicators")
      .select("indicator_type, indicator_value, user_id")
      .in("user_id", learnerIds)
      .gte("week_start_date", lastMonthStart.toISOString().split('T')[0])
      .lt("week_start_date", currentWeekStart.toISOString().split('T')[0]);

    // Calculer les moyennes pour cette semaine
    const currentWeekAverages = {
      stress: 0,
      wellbeing: 0,
      motivation: 0,
    };
    const currentWeekCounts = { stress: 0, wellbeing: 0, motivation: 0 };
    
    (currentWeekIndicators ?? []).forEach((indicator) => {
      const type = indicator.indicator_type as 'stress' | 'wellbeing' | 'motivation';
      if (type === 'stress' || type === 'wellbeing' || type === 'motivation') {
        currentWeekAverages[type] += Number(indicator.indicator_value) || 0;
        currentWeekCounts[type] += 1;
      }
    });

    Object.keys(currentWeekAverages).forEach((key) => {
      if (currentWeekCounts[key as keyof typeof currentWeekCounts] > 0) {
        currentWeekAverages[key as keyof typeof currentWeekAverages] /= currentWeekCounts[key as keyof typeof currentWeekCounts];
      }
    });

    // Calculer les moyennes pour la semaine dernière
    const lastWeekAverages = {
      stress: 0,
      wellbeing: 0,
      motivation: 0,
    };
    const lastWeekCounts = { stress: 0, wellbeing: 0, motivation: 0 };
    
    (lastWeekIndicators ?? []).forEach((indicator) => {
      const type = indicator.indicator_type as 'stress' | 'wellbeing' | 'motivation';
      if (type === 'stress' || type === 'wellbeing' || type === 'motivation') {
        lastWeekAverages[type] += Number(indicator.indicator_value) || 0;
        lastWeekCounts[type] += 1;
      }
    });

    Object.keys(lastWeekAverages).forEach((key) => {
      if (lastWeekCounts[key as keyof typeof lastWeekCounts] > 0) {
        lastWeekAverages[key as keyof typeof lastWeekAverages] /= lastWeekCounts[key as keyof typeof lastWeekCounts];
      }
    });

    // Calculer les moyennes pour le mois dernier
    const lastMonthAverages = {
      stress: 0,
      wellbeing: 0,
      motivation: 0,
    };
    const lastMonthCounts = { stress: 0, wellbeing: 0, motivation: 0 };
    
    (lastMonthIndicators ?? []).forEach((indicator) => {
      const type = indicator.indicator_type as 'stress' | 'wellbeing' | 'motivation';
      if (type === 'stress' || type === 'wellbeing' || type === 'motivation') {
        lastMonthAverages[type] += Number(indicator.indicator_value) || 0;
        lastMonthCounts[type] += 1;
      }
    });

    Object.keys(lastMonthAverages).forEach((key) => {
      if (lastMonthCounts[key as keyof typeof lastMonthCounts] > 0) {
        lastMonthAverages[key as keyof typeof lastMonthAverages] /= lastMonthCounts[key as keyof typeof lastMonthCounts];
      }
    });

    // Calculer les tendances (comparaison semaine actuelle vs semaine dernière)
    const weeklyTrends = {
      stress: currentWeekCounts.stress > 0 && lastWeekCounts.stress > 0
        ? (currentWeekAverages.stress > lastWeekAverages.stress + 2 ? "up" : 
           currentWeekAverages.stress < lastWeekAverages.stress - 2 ? "down" : "stable")
        : "stable" as "up" | "down" | "stable",
      wellbeing: currentWeekCounts.wellbeing > 0 && lastWeekCounts.wellbeing > 0
        ? (currentWeekAverages.wellbeing > lastWeekAverages.wellbeing + 2 ? "up" : 
           currentWeekAverages.wellbeing < lastWeekAverages.wellbeing - 2 ? "down" : "stable")
        : "stable" as "up" | "down" | "stable",
      motivation: currentWeekCounts.motivation > 0 && lastWeekCounts.motivation > 0
        ? (currentWeekAverages.motivation > lastWeekAverages.motivation + 2 ? "up" : 
           currentWeekAverages.motivation < lastWeekAverages.motivation - 2 ? "down" : "stable")
        : "stable" as "up" | "down" | "stable",
    };

    return NextResponse.json({
      totalLearners,
      atRiskLearners,
      averageScore,
      scoreTrend,
      completedQuestionnaires: completedCount || 0,
      pendingQuestionnaires: pendingCount || 0,
      dimensionAverages,
      alerts,
      // Nouvelles statistiques hebdomadaires et mensuelles
      weeklyAverages: {
        current: currentWeekAverages,
        last: lastWeekAverages,
        trends: weeklyTrends,
      },
      monthlyAverages: {
        last: lastMonthAverages,
      },
    });
  } catch (error) {
    console.error("[beyond-care/admin/stats] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}


