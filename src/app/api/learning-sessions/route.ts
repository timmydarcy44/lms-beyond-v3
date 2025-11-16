import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

// POST - Créer une nouvelle session
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content_type, content_id } = body;

    if (!content_type || !content_id) {
      return NextResponse.json(
        { error: "content_type and content_id are required" },
        { status: 400 }
      );
    }

    // Utiliser le service role client pour contourner RLS
    const adminClient = await getServiceRoleClientOrFallback();
    const queryClient = adminClient ?? supabase;

    // Créer la session
    const { data: session, error } = await queryClient
      .from("learning_sessions")
      .insert({
        user_id: user.id,
        content_type,
        content_id,
        started_at: new Date().toISOString(),
        duration_seconds: 0,
        duration_active_seconds: 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[learning-sessions] Error creating session:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("[learning-sessions] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une session
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, duration_seconds, duration_active_seconds, ended_at } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Utiliser le service role client pour contourner RLS
    const adminClient = await getServiceRoleClientOrFallback();
    const queryClient = adminClient ?? supabase;

    // Vérifier que la session appartient à l'utilisateur
    const { data: existingSession, error: checkError } = await queryClient
      .from("learning_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (checkError || !existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existingSession.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Mettre à jour la session
    const updateData: any = {};
    if (duration_seconds !== undefined) updateData.duration_seconds = duration_seconds;
    if (duration_active_seconds !== undefined) updateData.duration_active_seconds = duration_active_seconds;
    if (ended_at) updateData.ended_at = ended_at;

    const { error } = await queryClient
      .from("learning_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) {
      console.error("[learning-sessions] Error updating session:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[learning-sessions] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



