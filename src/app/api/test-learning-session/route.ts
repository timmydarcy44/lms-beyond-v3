import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Route de test pour simuler une session d'apprentissage
 * Usage: POST /api/test-learning-session
 * Body: { content_type: "course" | "path" | "resource" | "test", content_id: "uuid" }
 */
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
    const { content_type, content_id, duration_seconds, duration_active_seconds } = body;

    if (!content_type || !content_id) {
      return NextResponse.json(
        { error: "content_type and content_id are required" },
        { status: 400 }
      );
    }

    // Créer une session de test
    const { data: session, error } = await supabase
      .from("learning_sessions")
      .insert({
        user_id: user.id,
        content_type,
        content_id,
        started_at: new Date().toISOString(),
        duration_seconds: duration_seconds || 120, // 2 minutes par défaut
        duration_active_seconds: duration_active_seconds || 90, // 1.5 minutes actif par défaut
        ended_at: new Date().toISOString(),
      })
      .select("id, duration_seconds, duration_active_seconds")
      .single();

    if (error) {
      console.error("[test-learning-session] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        duration_seconds: session.duration_seconds,
        duration_active_seconds: session.duration_active_seconds,
        engagement_ratio: (
          (session.duration_active_seconds / session.duration_seconds) *
          100
        ).toFixed(2) + "%",
      },
      message: "Session de test créée avec succès",
    });
  } catch (error) {
    console.error("[test-learning-session] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Route GET pour vérifier les sessions existantes
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const { data: sessions, error } = await supabase
      .from("learning_sessions")
      .select("id, content_type, content_id, duration_seconds, duration_active_seconds, started_at, ended_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: sessions?.length || 0,
      sessions: sessions?.map((s) => ({
        ...s,
        engagement_ratio:
          s.duration_seconds > 0
            ? ((s.duration_active_seconds / s.duration_seconds) * 100).toFixed(2) + "%"
            : "0%",
      })),
    });
  } catch (error) {
    console.error("[test-learning-session] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}









