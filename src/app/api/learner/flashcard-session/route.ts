import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as {
      courseId?: string | null;
      scopeId?: string;
      totalCards?: number;
      knownCount?: number;
      unknownCount?: number;
      cardResults?: Array<{ cardId: string; result: "known" | "unknown" }>;
      durationSeconds?: number;
      startedAt?: string;
    };

    const scopeId = String(body.scopeId ?? "").trim();
    if (!scopeId) {
      return NextResponse.json({ error: "scopeId requis" }, { status: 400 });
    }

    const totalCards = Math.max(0, Number(body.totalCards ?? 0));
    const knownCount = Math.max(0, Number(body.knownCount ?? 0));
    const unknownCount = Math.max(0, Number(body.unknownCount ?? 0));

    if (totalCards === 0 && knownCount === 0 && unknownCount === 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const startedAt = body.startedAt ? new Date(body.startedAt).toISOString() : new Date().toISOString();
    const durationSeconds = Math.max(0, Number(body.durationSeconds ?? 0));

    const { data, error } = await supabase
      .from("flashcard_study_sessions")
      .insert({
        user_id: user.id,
        course_id: body.courseId || null,
        scope_id: scopeId,
        total_cards: totalCards,
        known_count: knownCount,
        unknown_count: unknownCount,
        card_results: body.cardResults ?? [],
        duration_seconds: durationSeconds,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[flashcard-session] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("[flashcard-session]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
