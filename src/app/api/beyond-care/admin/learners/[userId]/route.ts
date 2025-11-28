import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { hasUserFeature } from "@/lib/queries/organization-features";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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

    // Récupérer l'organisation de l'admin
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", session.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur fait partie de la même organisation
    const { data: userMembership } = await dataClient
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .eq("org_id", membership.org_id)
      .single();

    if (!userMembership) {
      return NextResponse.json({ error: "Utilisateur non trouvé dans votre organisation" }, { status: 404 });
    }

    // Récupérer le profil
    const { data: profile } = await dataClient
      .from("profiles")
      .select("id, email, full_name, phone")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    // Récupérer les indicateurs de performance (sur les 12 dernières semaines)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 semaines

    const { data: indicators } = await dataClient
      .from("mental_health_indicators")
      .select("*")
      .eq("user_id", userId)
      .gte("week_start_date", twelveWeeksAgo.toISOString().split('T')[0])
      .order("week_start_date", { ascending: true });

    // Organiser les indicateurs par type et par semaine
    const indicatorsByType: {
      stress: Array<{ week: string; value: number }>;
      wellbeing: Array<{ week: string; value: number }>;
      motivation: Array<{ week: string; value: number }>;
    } = {
      stress: [],
      wellbeing: [],
      motivation: [],
    };

    (indicators || []).forEach((indicator: any) => {
      const type = indicator.indicator_type as 'stress' | 'wellbeing' | 'motivation';
      if (type === 'stress' || type === 'wellbeing' || type === 'motivation') {
        indicatorsByType[type].push({
          week: indicator.week_start_date,
          value: Number(indicator.indicator_value) || 0,
        });
      }
    });

    // Récupérer les résultats des tests soft skills (test_attempts)
    const { data: testAttempts } = await dataClient
      .from("test_attempts")
      .select(`
        *,
        tests:test_id (
          id,
          title,
          description,
          display_format
        )
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    // Récupérer les résultats des questionnaires Beyond Care (mental_health_assessments)
    const { data: assessments } = await dataClient
      .from("mental_health_assessments")
      .select(`
        *,
        mental_health_questionnaires:questionnaire_id (
          id,
          title,
          description
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Transformer les assessments en format compatible avec les tests
    const softSkillsResults = (assessments || []).map((assessment: any) => {
      const categoryResults = Object.entries(assessment.dimension_scores || {}).map(([dimension, score]) => ({
        category: dimension,
        score: typeof score === 'number' ? score : 0,
        maxScore: 100,
        percentage: typeof score === 'number' ? score : 0,
      }));

      return {
        id: assessment.id,
        testId: assessment.questionnaire_id,
        testTitle: assessment.mental_health_questionnaires?.title || "Questionnaire Beyond Care",
        completedAt: assessment.created_at,
        overallScore: assessment.overall_score || 0,
        categoryResults,
        analysis: assessment.analysis_summary || assessment.analysis_details || null,
      };
    });

    // Transformer les test_attempts
    const testResults = (testAttempts || []).map((attempt: any) => {
      const categoryResults = Array.isArray(attempt.category_results)
        ? attempt.category_results
        : [];

      return {
        id: attempt.id,
        testId: attempt.test_id,
        testTitle: attempt.tests?.title || "Test",
        completedAt: attempt.completed_at,
        overallScore: attempt.percentage || 0,
        categoryResults,
        analysis: null,
      };
    });

    // Combiner tous les résultats de tests
    const allTestResults = [...testResults, ...softSkillsResults].sort((a, b) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return dateB - dateA;
    });

    // Récupérer les dernières valeurs des indicateurs
    const latestIndicators = {
      stress: indicatorsByType.stress[indicatorsByType.stress.length - 1]?.value || 0,
      wellbeing: indicatorsByType.wellbeing[indicatorsByType.wellbeing.length - 1]?.value || 0,
      motivation: indicatorsByType.motivation[indicatorsByType.motivation.length - 1]?.value || 0,
    };

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.full_name || profile.email || "Apprenant",
        email: profile.email || "",
        phone: profile.phone || null,
      },
      indicators: {
        current: latestIndicators,
        evolution: indicatorsByType,
      },
      testResults: allTestResults,
    });
  } catch (error) {
    console.error("[beyond-care/admin/learners/[userId]] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des détails" },
      { status: 500 }
    );
  }
}

