import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
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

    console.log("[beyond-care/admin/learners] Org ID:", membership.org_id);

    // Récupérer tous les apprenants de l'organisation
    const { data: learnerMemberships, error: membershipsError } = await dataClient
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", membership.org_id)
      .eq("role", "learner");

    if (membershipsError) {
      console.error("[beyond-care/admin/learners] Error fetching memberships:", membershipsError);
      return NextResponse.json({ error: "Erreur lors de la récupération des membres" }, { status: 500 });
    }

    console.log("[beyond-care/admin/learners] Learner memberships:", learnerMemberships?.length || 0);

    const learnerIds = learnerMemberships?.map(l => l.user_id) || [];

    if (learnerIds.length === 0) {
      return NextResponse.json({ learners: [] });
    }

    // Récupérer les profils des apprenants
    const { data: profiles, error: profilesError } = await dataClient
      .from("profiles")
      .select("id, email, full_name, phone")
      .in("id", learnerIds);

    if (profilesError) {
      console.error("[beyond-care/admin/learners] Error fetching profiles:", profilesError);
      return NextResponse.json({ error: "Erreur lors de la récupération des profils" }, { status: 500 });
    }

    console.log("[beyond-care/admin/learners] Profiles found:", profiles?.length || 0);

    // Récupérer les indicateurs de santé mentale (les plus récents par type et par utilisateur)
    const { data: indicators, error: indicatorsError } = await dataClient
      .from("mental_health_indicators")
      .select("*")
      .in("user_id", learnerIds)
      .order("week_start_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (indicatorsError) {
      console.error("[beyond-care/admin/learners] Error fetching indicators:", indicatorsError);
    }

    console.log("[beyond-care/admin/learners] Indicators found:", indicators?.length || 0);

    // Récupérer les questionnaires actifs
    const { data: questionnaires } = await dataClient
      .from("mental_health_questionnaires")
      .select("id, frequency, send_day, send_time")
      .eq("org_id", membership.org_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    // Récupérer les réponses pour chaque apprenant
    const { data: responses } = await dataClient
      .from("mental_health_responses")
      .select("user_id, questionnaire_id, created_at")
      .in("user_id", learnerIds)
      .order("created_at", { ascending: false });

    // Construire la liste des apprenants avec leurs stats
    const learners = (profiles || []).map(profile => {
      const userIndicators = indicators?.filter(i => i.user_id === profile.id) || [];
      
      // Séparer les indicateurs par type
      const stressIndicators = userIndicators.filter(i => i.indicator_type === 'stress').sort((a, b) => 
        new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
      );
      const wellbeingIndicators = userIndicators.filter(i => i.indicator_type === 'wellbeing').sort((a, b) => 
        new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
      );
      const motivationIndicators = userIndicators.filter(i => i.indicator_type === 'motivation').sort((a, b) => 
        new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
      );

      const latestStress = stressIndicators[0]?.indicator_value || 0;
      const latestWellbeing = wellbeingIndicators[0]?.indicator_value || 0;
      const latestMotivation = motivationIndicators[0]?.indicator_value || 0;

      const userResponses = responses?.filter(r => r.user_id === profile.id) || [];
      const lastResponse = userResponses[0];

      // Calculer le score global
      let lastScore: number | null = null;
      if (latestStress > 0 || latestWellbeing > 0 || latestMotivation > 0) {
        lastScore = (Number(latestStress) + Number(latestWellbeing) + Number(latestMotivation)) / 3;
      }

      // Déterminer la tendance
      let trend: "up" | "down" | "stable" = "stable";
      if (stressIndicators.length >= 2 && wellbeingIndicators.length >= 2 && motivationIndicators.length >= 2) {
        const current = (Number(stressIndicators[0].indicator_value) + Number(wellbeingIndicators[0].indicator_value) + Number(motivationIndicators[0].indicator_value)) / 3;
        const previous = (Number(stressIndicators[1].indicator_value) + Number(wellbeingIndicators[1].indicator_value) + Number(motivationIndicators[1].indicator_value)) / 3;
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
        phone: profile.phone || null,
        lastScore,
        trend,
        lastQuestionnaireDate: lastResponse?.created_at || null,
        nextQuestionnaireDate,
        riskLevel,
        indicators: {
          stress: Number(latestStress),
          wellbeing: Number(latestWellbeing),
          motivation: Number(latestMotivation),
        },
      };
    });

    console.log("[beyond-care/admin/learners] Returning learners:", learners.length);
    return NextResponse.json({ learners });
  } catch (error) {
    console.error("[beyond-care/admin/learners] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des apprenants" },
      { status: 500 }
    );
  }
}








