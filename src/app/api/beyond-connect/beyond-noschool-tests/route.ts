import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère les tests Beyond No School disponibles pour les candidats
 * GET /api/beyond-connect/beyond-noschool-tests
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les questionnaires de santé mentale (tests) de Beyond No School
    // On cherche ceux créés par Tim Darcy (Beyond No School)
    const { data: timDarcyProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "timdarcypro@gmail.com")
      .maybeSingle();

    if (!timDarcyProfile) {
      return NextResponse.json({ tests: [] });
    }

    // Récupérer les questionnaires actifs créés par Tim Darcy
    const { data: questionnaires, error: qError } = await supabase
      .from("mental_health_questionnaires")
      .select("id, title, description, created_at")
      .eq("created_by", timDarcyProfile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (qError) {
      console.error("[beyond-connect/beyond-noschool-tests] Error:", qError);
      return NextResponse.json({ tests: [] });
    }

    // Vérifier quels tests l'utilisateur a déjà complétés
    const { data: completedTests } = await supabase
      .from("mental_health_assessments")
      .select("questionnaire_id, completed_at, score")
      .eq("user_id", user.id);

    const completedIds = new Set(completedTests?.map((t) => t.questionnaire_id) || []);

    const tests = (questionnaires || []).map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      created_at: q.created_at,
      is_completed: completedIds.has(q.id),
      completed_at: completedTests?.find((t) => t.questionnaire_id === q.id)?.completed_at,
      score: completedTests?.find((t) => t.questionnaire_id === q.id)?.score,
    }));

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("[api/beyond-connect/beyond-noschool-tests] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tests" },
      { status: 500 }
    );
  }
}

