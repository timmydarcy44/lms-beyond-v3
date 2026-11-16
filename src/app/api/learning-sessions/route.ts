import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import {
  SESSION_GAP_MS,
  metricsFromLegacySessionRows,
  computeLearnerTimeMetrics,
} from "@/lib/lms/lms-metrics";

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

async function recomputeSessionDurations(
  queryClient: Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>,
  sessionId: string,
  userId: string,
) {
  if (!queryClient) return;

  // Signaux d’activité (si table présente)
  const signalsRes = await queryClient
    .from("learning_activity_signals")
    .select("happened_at, kind")
    .eq("session_id", sessionId)
    .order("happened_at", { ascending: true })
    .limit(5000);

  const { data: sessionRow } = await queryClient
    .from(LEARNING_SESSIONS_TABLE)
    .select("started_at, ended_at, duration_seconds, duration_active_seconds")
    .eq("id", sessionId)
    .maybeSingle();

  if (!sessionRow) return;

  const events = [
    ...(sessionRow.started_at ? [{ at: sessionRow.started_at as string, kind: "presence" as const }] : []),
    ...((signalsRes.data ?? []) as Array<{ happened_at: string; kind: string }>).map((s) => ({
      at: s.happened_at,
      kind: (s.kind === "heartbeat" || s.kind === "interaction" ? s.kind : "presence") as
        | "heartbeat"
        | "interaction"
        | "presence",
    })),
  ];

  const heartbeats = ((signalsRes.data ?? []) as Array<{ happened_at: string; kind: string }>)
    .filter((s) => s.kind === "heartbeat" || s.kind === "interaction")
    .map((s) => s.happened_at);

  const metrics =
    heartbeats.length > 0
      ? computeLearnerTimeMetrics({ events, heartbeats })
      : metricsFromLegacySessionRows([
          {
            started_at: sessionRow.started_at as string,
            ended_at: (sessionRow.ended_at as string | null) ?? null,
            duration_seconds: Number(sessionRow.duration_seconds) || 0,
            duration_active_seconds: Number(sessionRow.duration_active_seconds) || 0,
          },
        ]);

  const connected = metrics.sessions[0]?.connectedSeconds ?? metrics.connectedSeconds;
  const active = Math.min(metrics.sessions[0]?.activeSeconds ?? metrics.activeSeconds, connected);

  await queryClient
    .from(LEARNING_SESSIONS_TABLE)
    .update({
      duration_seconds: connected,
      duration_active_seconds: active,
      ended_at: new Date().toISOString(),
      user_id: userId,
    })
    .eq("id", sessionId);
}

// POST - Créer ou réutiliser une séance (gap < 30 min)
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
      tab_id?: string;
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

    // Réutiliser la séance ouverte si dernière activité < 30 min (pas de nouvelle séance au refresh)
    const sinceIso = new Date(Date.now() - SESSION_GAP_MS).toISOString();
    const { data: recent } = await queryClient
      .from(LEARNING_SESSIONS_TABLE)
      .select("id, started_at, ended_at")
      .eq("user_id", user.id)
      .or(`ended_at.gte.${sinceIso},and(ended_at.is.null,started_at.gte.${sinceIso})`)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.id) {
      await queryClient
        .from(LEARNING_SESSIONS_TABLE)
        .update({
          ended_at: new Date().toISOString(),
          content_type,
          content_id: content_id.trim(),
        })
        .eq("id", recent.id);

      return NextResponse.json({ sessionId: recent.id, reused: true });
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

    return NextResponse.json({ sessionId: session.id, reused: false });
  } catch (error) {
    return apiErrorResponse(error, 500);
  }
}

// PATCH - Finaliser / mettre à jour une session
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
      finalize?: boolean;
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

    if (body.finalize) {
      await recomputeSessionDurations(queryClient, sessionId, user.id);
      return NextResponse.json({ success: true });
    }

    // Compat : anciens clients qui envoient encore duration_* — on plafonne actif ≤ connecté
    const patch: Record<string, unknown> = { ended_at: new Date().toISOString() };
    if (typeof body.duration_seconds === "number" && body.duration_seconds >= 0) {
      patch.duration_seconds = Math.floor(body.duration_seconds);
    }
    if (typeof body.duration_active_seconds === "number" && body.duration_active_seconds >= 0) {
      const connected =
        typeof patch.duration_seconds === "number"
          ? (patch.duration_seconds as number)
          : Math.floor(body.duration_active_seconds);
      patch.duration_active_seconds = Math.min(Math.floor(body.duration_active_seconds), connected);
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
