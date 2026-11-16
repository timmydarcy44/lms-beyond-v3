import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import {
  INTERACTION_WINDOW_MS,
  computeLearnerTimeMetrics,
  metricsFromLegacySessionRows,
} from "@/lib/lms/lms-metrics";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/**
 * Heartbeat d’activité : un ping toutes les ~30 s quand l’onglet est visible
 * et qu’il y a eu une interaction depuis moins de 2 min.
 * Met à jour duration_* de la séance selon lms-metrics (actif ≤ connecté).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: {
      sessionId?: string;
      tabId?: string;
      content_type?: string;
      content_id?: string;
      interacted_within_ms?: number;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const sessionId = body.sessionId?.trim();
    if (!sessionId || !isUuid(sessionId)) {
      return NextResponse.json({ error: "sessionId must be a valid UUID" }, { status: 400 });
    }

    const interactedWithin =
      typeof body.interacted_within_ms === "number" ? body.interacted_within_ms : 0;
    if (interactedWithin > INTERACTION_WINDOW_MS) {
      return NextResponse.json({ ok: true, skipped: "idle" });
    }

    const adminClient = await getServiceRoleClientOrFallback();
    const db = adminClient ?? supabase;

    const { data: session, error: sessionError } = await db
      .from("learning_sessions")
      .select("id, user_id, started_at, ended_at, duration_seconds, duration_active_seconds")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (String(session.user_id) !== String(user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const nowIso = new Date().toISOString();

    // Insert signal (table optionnelle — ignore si absente)
    const signalInsert = await db.from("learning_activity_signals").insert({
      user_id: user.id,
      session_id: sessionId,
      happened_at: nowIso,
      kind: "heartbeat",
      content_type: body.content_type ?? null,
      content_id: body.content_id && isUuid(body.content_id) ? body.content_id : null,
      tab_id: body.tabId ?? null,
    });

    if (signalInsert.error && !/schema cache|does not exist|relation/i.test(signalInsert.error.message)) {
      console.warn("[heartbeat] signal insert:", signalInsert.error.message);
    }

    // Charger les signaux pour recalcul
    const { data: signals } = await db
      .from("learning_activity_signals")
      .select("happened_at, kind")
      .eq("session_id", sessionId)
      .order("happened_at", { ascending: true })
      .limit(5000);

    const signalRows = (signals ?? []) as Array<{ happened_at: string; kind: string }>;
    const events = [
      ...(session.started_at ? [{ at: session.started_at as string, kind: "presence" as const }] : []),
      ...signalRows.map((s) => ({
        at: s.happened_at,
        kind: (s.kind === "heartbeat" || s.kind === "interaction" ? s.kind : "presence") as
          | "heartbeat"
          | "interaction"
          | "presence",
      })),
      { at: nowIso, kind: "heartbeat" as const },
    ];
    const heartbeats = [
      ...signalRows.filter((s) => s.kind === "heartbeat" || s.kind === "interaction").map((s) => s.happened_at),
      nowIso,
    ];

    const metrics =
      heartbeats.length >= 2
        ? computeLearnerTimeMetrics({ events, heartbeats })
        : metricsFromLegacySessionRows([
            {
              started_at: session.started_at as string,
              ended_at: nowIso,
              duration_seconds: Number(session.duration_seconds) || 0,
              duration_active_seconds: Number(session.duration_active_seconds) || 0,
            },
          ]);

    const connected = metrics.sessions[0]?.connectedSeconds ?? metrics.connectedSeconds;
    const active = Math.min(metrics.sessions[0]?.activeSeconds ?? metrics.activeSeconds, connected);

    const patch: Record<string, unknown> = {
      ended_at: nowIso,
      duration_seconds: connected,
      duration_active_seconds: active,
    };
    if (body.content_type && body.content_id && isUuid(body.content_id)) {
      patch.content_type = body.content_type;
      patch.content_id = body.content_id;
    }

    const { error: updateError } = await db.from("learning_sessions").update(patch).eq("id", sessionId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      duration_seconds: connected,
      duration_active_seconds: active,
    });
  } catch (error) {
    console.error("[heartbeat]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
