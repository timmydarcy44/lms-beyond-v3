import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

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

    // Récupérer l'organisation de l'utilisateur
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Utilisateur non associé à une organisation" },
        { status: 400 }
      );
    }

    // Insérer les réponses
    const responsesToInsert = Object.entries(responses).map(([questionId, responseValue]) => {
      const responseData = Array.isArray(responseValue)
        ? { selected: responseValue }
        : typeof responseValue === "object"
        ? responseValue
        : { value: responseValue };

      return {
        questionnaire_id,
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
      console.error("[mental-health/responses] Error inserting responses:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement des réponses" },
        { status: 500 }
      );
    }

    // TODO: Calculer et enregistrer les indicateurs basés sur les réponses
    // Cette logique sera implémentée dans une fonction séparée

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mental-health/responses] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questionnaireId = searchParams.get("questionnaire_id");
    const orgId = searchParams.get("org_id");

    let query = supabase
      .from("mental_health_responses")
      .select(`
        *,
        question:mental_health_questions(*),
        questionnaire:mental_health_questionnaires(*)
      `);

    // Si questionnaire_id est fourni, filtrer par questionnaire
    if (questionnaireId) {
      query = query.eq("questionnaire_id", questionnaireId);
    }

    // Si org_id est fourni, filtrer par organisation (pour les admins/formateurs)
    if (orgId) {
      query = query.eq("org_id", orgId);
    } else {
      // Sinon, seulement les réponses de l'utilisateur
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[mental-health/responses] Error fetching responses:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des réponses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ responses: data || [] });
  } catch (error) {
    console.error("[mental-health/responses] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}







