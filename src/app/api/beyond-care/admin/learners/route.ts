import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { hasUserFeature } from "@/lib/queries/organization-features";

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
    const { data: learnerMemberships } = await supabase
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", membership.org_id)
      .eq("role", "learner");

    const learnerIds = learnerMemberships?.map(l => l.user_id) || [];

    if (learnerIds.length === 0) {
      return NextResponse.json({ learners: [] });
    }

    // Récupérer les profils des apprenants
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", learnerIds);

    // Récupérer les indicateurs de santé mentale
    const { data: indicators } = await supabase
      .from("mental_health_indicators")
      .select("*")
      .in("user_id", learnerIds)
      .order("created_at", { ascending: false });

    // Récupérer les questionnaires actifs
    const { data: questionnaires } = await supabase
      .from("mental_health_questionnaires")
      .select("id, frequency, send_day, send_time")
      .eq("org_id", membership.org_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    // Récupérer les réponses pour chaque apprenant
    const { data: responses } = await supabase
      .from("mental_health_responses")
      .select("user_id, questionnaire_id, created_at")
      .in("user_id", learnerIds)
      .order("created_at", { ascending: false });

    // Construire la liste des apprenants avec leurs stats
    const learners = (profiles || []).map(profile => {
      const userIndicators = indicators?.filter(i => i.user_id === profile.id) || [];
      const latestIndicator = userIndicators[0];

      const userResponses = responses?.filter(r => r.user_id === profile.id) || [];
      const lastResponse = userResponses[0];

      // Calculer le score global
      let lastScore: number | null = null;
      if (latestIndicator) {
        lastScore = (latestIndicator.stress_score + latestIndicator.wellbeing_score + latestIndicator.motivation_score) / 3;
      }

      // Déterminer la tendance
      let trend: "up" | "down" | "stable" = "stable";
      if (userIndicators.length >= 2) {
        const current = (userIndicators[0].stress_score + userIndicators[0].wellbeing_score + userIndicators[0].motivation_score) / 3;
        const previous = (userIndicators[1].stress_score + userIndicators[1].wellbeing_score + userIndicators[1].motivation_score) / 3;
        if (current > previous + 5) trend = "up";
        else if (current < previous - 5) trend = "down";
      }

      // Déterminer le niveau de risque
      let riskLevel: "low" | "medium" | "high" = "low";
      if (lastScore !== null) {
        if (lastScore < 40) riskLevel = "high";
        else if (lastScore < 60) riskLevel = "medium";
      }

      // Calculer la date du prochain questionnaire
      let nextQuestionnaireDate: string | null = null;
      if (questionnaires) {
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
      }

      return {
        id: profile.id,
        name: profile.full_name || profile.email || "Apprenant",
        email: profile.email || "",
        lastScore,
        trend,
        lastQuestionnaireDate: lastResponse?.created_at || null,
        nextQuestionnaireDate,
        riskLevel,
        indicators: {
          stress: latestIndicator?.stress_score || 0,
          wellbeing: latestIndicator?.wellbeing_score || 0,
          motivation: latestIndicator?.motivation_score || 0,
        },
      };
    });

    return NextResponse.json({ learners });
  } catch (error) {
    console.error("[beyond-care/admin/learners] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des apprenants" },
      { status: 500 }
    );
  }
}



