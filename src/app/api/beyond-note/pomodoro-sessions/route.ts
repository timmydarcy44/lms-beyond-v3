import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const body = await request.json();
    const {
      document_id,
      duration_minutes,
      completed,
      ended_at,
      actions_performed,
    } = body || {};

    if (!document_id || !duration_minutes) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const { error } = await supabase
      .from("beyond_note_pomodoro_sessions")
      .insert({
        document_id,
        duration_minutes,
        completed: Boolean(completed),
        ended_at: ended_at || new Date().toISOString(),
        actions_performed: actions_performed || {},
      });

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
