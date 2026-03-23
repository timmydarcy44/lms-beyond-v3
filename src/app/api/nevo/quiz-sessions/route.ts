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
      folder_id,
      score,
      max_score,
      nb_questions,
      quiz_type,
    } = body || {};

    if (!document_id || typeof score !== "number" || typeof max_score !== "number") {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const { error } = await supabase.from("beyond_note_quiz_sessions").insert({
      user_id: session.id,
      document_id,
      folder_id: folder_id || null,
      score,
      max_score,
      nb_questions: nb_questions || null,
      quiz_type: quiz_type || null,
      created_at: new Date().toISOString(),
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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folder_id");
    const documentId = searchParams.get("document_id");
    if (!folderId && !documentId) {
      return NextResponse.json({ error: "folder_id ou document_id requis" }, { status: 400 });
    }

    let query = supabase
      .from("beyond_note_quiz_sessions")
      .select("*")
      .eq("user_id", session.id);

    if (folderId) {
      query = query.eq("folder_id", folderId);
    }
    if (documentId) {
      query = query.eq("document_id", documentId);
    }

    const { data: sessions, error } = await query.order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération", details: error.message },
        { status: 500 }
      );
    }

    const safeSessions = sessions || [];
    const scoresOn20 = safeSessions
      .map((s: any) => {
        const maxScore = Number(s.max_score);
        const score = Number(s.score);
        if (!Number.isFinite(maxScore) || maxScore <= 0 || !Number.isFinite(score)) {
          return null;
        }
        return (score / maxScore) * 20;
      })
      .filter((v: number | null) => v !== null) as number[];

    const average =
      scoresOn20.length > 0
        ? Math.round(
            (scoresOn20.reduce((acc, val) => acc + val, 0) / scoresOn20.length) * 100
          ) / 100
        : 0;

    const evolution = safeSessions.map((s: any) => {
      const createdAt = typeof s.created_at === "string" ? s.created_at : new Date().toISOString();
      const maxScore = Number(s.max_score);
      const score = Number(s.score);
      const normalized =
        Number.isFinite(maxScore) && maxScore > 0 && Number.isFinite(score)
          ? Math.round((score / maxScore) * 2000) / 100
          : 0;
      return {
        date: createdAt.slice(0, 10),
        score: normalized,
      };
    });

    const lastSession = safeSessions.length > 0 ? safeSessions[safeSessions.length - 1] : null;

    return NextResponse.json({
      sessions: safeSessions,
      stats: {
        nb_quiz: safeSessions.length,
        average_score: average,
        evolution,
        last_session: lastSession,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
