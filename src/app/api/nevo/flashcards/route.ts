import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

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
    const documentId = searchParams.get("document_id");
    if (!documentId) {
      return NextResponse.json({ error: "document_id requis" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("beyond_note_flashcards")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ flashcards: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const { document_id, flashcards } = body || {};
    if (!document_id || !Array.isArray(flashcards)) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + 1);

    const payload = flashcards.map((card: { question: string; answer: string }) => ({
      document_id,
      user_id: session.id,
      question: card.question,
      answer: card.answer,
      interval_days: 1,
      ease_factor: 2.5,
      next_review_at: nextReview.toISOString(),
    }));

    const { data, error } = await supabase
      .from("beyond_note_flashcards")
      .insert(payload)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de la création", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ flashcards: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    const { id, decision } = body || {};
    if (!id || !decision) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from("beyond_note_flashcards")
      .select("interval_days, ease_factor")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Flashcard introuvable", details: fetchError?.message },
        { status: 404 }
      );
    }

    let intervalDays = existing.interval_days || 1;
    let easeFactor = existing.ease_factor || 2.5;

    if (decision === "known") {
      intervalDays = intervalDays * 2;
      easeFactor += 0.1;
    } else if (decision === "review") {
      intervalDays = 1;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    const { error } = await supabase
      .from("beyond_note_flashcards")
      .update({
        interval_days: intervalDays,
        ease_factor: easeFactor,
        next_review_at: nextReview.toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
