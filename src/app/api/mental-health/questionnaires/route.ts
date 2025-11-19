import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/auth/super-admin";

export async function POST(request: NextRequest) {
  try {
    const sessionClient = await getServerClient();

    if (!sessionClient) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isSuper = await isUserSuperAdmin(user.id);
    if (!isSuper) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const body = await request.json();
    const {
      org_id,
      title,
      description,
      frequency,
      send_day,
      send_time,
      target_roles,
      questions,
      scoring_config,
    } = body;

    if (!org_id || !title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "org_id, title et questions sont requis" },
        { status: 400 }
      );
    }

    // Créer le questionnaire
    const { data: questionnaire, error: questionnaireError } = await serviceClient
      .from("mental_health_questionnaires")
      .insert({
        org_id,
        title,
        description: description || null,
        frequency: frequency || "weekly",
        send_day: send_day || 5,
        send_time: send_time || "18:00:00",
        target_roles: target_roles || ["learner"],
        created_by: user.id,
        scoring_config: scoring_config || null,
      })
      .select()
      .single();

    if (questionnaireError || !questionnaire) {
      console.error("[mental-health/questionnaires] Error creating questionnaire:", questionnaireError);
      return NextResponse.json(
        { error: questionnaireError?.message || "Erreur lors de la création du questionnaire" },
        { status: 500 }
      );
    }

    // Créer les questions
    const questionsToInsert = questions.map((q: any, index: number) => ({
      questionnaire_id: questionnaire.id,
      question_text: q.question_text,
      question_type: q.question_type,
      order_index: index,
      is_required: q.is_required !== false,
      conditional_logic: q.conditional_logic || null,
      options: q.options || null,
      likert_scale: q.likert_scale || null,
      scoring: q.scoring || null,
      metadata: q.metadata || null,
    }));

    const { error: questionsError } = await serviceClient
      .from("mental_health_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("[mental-health/questionnaires] Error creating questions:", questionsError);
      // Supprimer le questionnaire créé en cas d'erreur
      await serviceClient
        .from("mental_health_questionnaires")
        .delete()
        .eq("id", questionnaire.id);
      
      return NextResponse.json(
        { error: questionsError.message || "Erreur lors de la création des questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questionnaire_id: questionnaire.id,
    });
  } catch (error) {
    console.error("[mental-health/questionnaires] Unexpected error:", error);
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
    const isSuper = await isUserSuperAdmin(user.id);
    const clientToUse = isSuper ? getServiceRoleClient() : supabase;

    if (!clientToUse) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");

    let query = clientToUse
      .from("mental_health_questionnaires")
      .select(`
        *,
        questions:mental_health_questions(id)
      `)
      .order("created_at", { ascending: false });

    if (orgId) {
      query = query.eq("org_id", orgId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[mental-health/questionnaires] Error fetching questionnaires:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des questionnaires" },
        { status: 500 }
      );
    }

    return NextResponse.json({ questionnaires: data || [] });
  } catch (error) {
    console.error("[mental-health/questionnaires] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}

