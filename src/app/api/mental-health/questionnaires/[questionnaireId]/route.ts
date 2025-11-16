import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionnaireId: string }> }
) {
  try {
    const { questionnaireId } = await params;
    const isSuper = await isSuperAdmin();
    const supabase = isSuper ? getServiceRoleClient() : await getServerClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: questionnaire, error } = await supabase
      .from("mental_health_questionnaires")
      .select(`
        *,
        questions:mental_health_questions(*)
      `)
      .eq("id", questionnaireId)
      .single();

    if (error || !questionnaire) {
      return NextResponse.json(
        { error: "Questionnaire non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ questionnaire });
  } catch (error) {
    console.error("[mental-health/questionnaires/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ questionnaireId: string }> }
) {
  try {
    const { questionnaireId } = await params;
    const isSuper = await isSuperAdmin();
    const supabase = isSuper ? getServiceRoleClient() : await getServerClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { is_active, ...updates } = body;

    const { data: questionnaire, error } = await supabase
      .from("mental_health_questionnaires")
      .update({
        ...updates,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionnaireId)
      .select()
      .single();

    if (error) {
      console.error("[mental-health/questionnaires/[id]] Error updating:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({ questionnaire });
  } catch (error) {
    console.error("[mental-health/questionnaires/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ questionnaireId: string }> }
) {
  try {
    const { questionnaireId } = await params;
    const isSuper = await isSuperAdmin();
    const supabase = isSuper ? getServiceRoleClient() : await getServerClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { error } = await supabase
      .from("mental_health_questionnaires")
      .delete()
      .eq("id", questionnaireId);

    if (error) {
      console.error("[mental-health/questionnaires/[id]] Error deleting:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mental-health/questionnaires/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}


