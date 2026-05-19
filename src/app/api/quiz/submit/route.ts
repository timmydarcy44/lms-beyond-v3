import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const testId = String(body.testId ?? "").trim();
    const score = typeof body.score === "number" ? body.score : Number(body.score);
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const review = body.review && typeof body.review === "object" ? body.review : {};

    if (!testId || Number.isNaN(score)) {
      return NextResponse.json({ error: "testId et score requis" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("quiz_submissions")
      .insert({
        test_id: testId,
        user_id: user.id,
        score: Math.round(score),
        answers: answers as Record<string, unknown>,
        review: review as Record<string, unknown>,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[quiz/submit]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("[quiz/submit]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
