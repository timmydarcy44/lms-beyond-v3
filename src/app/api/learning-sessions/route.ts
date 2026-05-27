import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

/** Uniquement `learning_sessions` (colonnes content_type, content_id, …). Ne pas utiliser `diagnostic_sessions`. */
const LEARNING_SESSIONS_TABLE = "learning_sessions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

function apiErrorResponse(error: unknown, status = 500) {
  console.error("API_ERROR:", error);
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status });
}

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

    let body: {
      content_type?: string;
      content_id?: string;
      user_id?: string | null;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { content_type, content_id, user_id: bodyUserId } = body;

    if (!content_type || !content_id) {
      return NextResponse.json({ error: "content_type and content_id are required" }, { status: 400 });
    }

    if (!isUuid(content_id)) {
      return NextResponse.json(
        { error: "content_id must be a valid UUID (not a slug or composite value)" },
        { status: 400 },
      );
    }

    if (bodyUserId != null && bodyUserId !== user.id) {
      return NextResponse.json({ error: "user_id must match authenticated user" }, { status: 403 });
    }

    const adminClient = await getServiceRoleClientOrFallback();
    const queryClient = adminClient ?? supabase;

    const { data: profile, error: profileError } = await queryClient
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[learning-sessions] profile lookup:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    if (!profile) {
      return NextResponse.json(
        { error: "Profil introuvable : impossible d’enregistrer la session sans ligne profiles." },
        { status: 403 },
      );
    }

    const { data: session, error } = await queryClient
      .from(LEARNING_SESSIONS_TABLE)
      .insert({
        user_id: user.id,
        content_type,
        content_id: content_id.trim(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[learning-sessions] Error creating session:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return apiErrorResponse(error, 500);
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

    let body: {
      sessionId?: string;
      session_id?: string;
      duration_seconds?: number;
      duration_active_seconds?: number;
      metadata?: Record<string, unknown>;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const sessionId = (body.sessionId ?? body.session_id)?.trim();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (!isUuid(sessionId)) {
      return NextResponse.json({ error: "sessionId must be a valid UUID" }, { status: 400 });
    }

    const adminClient = await getServiceRoleClientOrFallback();
    const queryClient = adminClient ?? supabase;

    const { data: existingSession, error: checkError } = await queryClient
      .from(LEARNING_SESSIONS_TABLE)
      .select("user_id")
      .eq("id", sessionId.trim())
      .single();

    if (checkError || !existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (String(existingSession.user_id) !== String(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const patch: Record<string, unknown> = { ended_at: new Date().toISOString() };
    if (typeof body.duration_seconds === "number" && body.duration_seconds >= 0) {
      patch.duration_seconds = Math.floor(body.duration_seconds);
    }
    if (typeof body.duration_active_seconds === "number" && body.duration_active_seconds >= 0) {
      patch.duration_active_seconds = Math.floor(body.duration_active_seconds);
    }
    if (body.metadata && typeof body.metadata === "object") {
      patch.metadata = body.metadata;
    }

    const { error } = await queryClient.from(LEARNING_SESSIONS_TABLE).update(patch).eq("id", sessionId);

    if (error) {
      console.error("[learning-sessions] Error updating session:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, 500);
  }
}
