import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildQuizUnlockEmail } from "@/lib/email/quiz-unlock-notice";
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

    const roundedScore = Math.round(score);
    const openedModule = String(body.openedModule ?? "")
      .replace(/[\r\n\t]+/g, " ")
      .trim()
      .slice(0, 120);
    const minPercentRaw = Number(body.minPercent);
    const minPercent = Number.isFinite(minPercentRaw)
      ? Math.min(100, Math.max(1, Math.round(minPercentRaw)))
      : 80;
    const opensModule = Boolean(openedModule) && roundedScore >= minPercent;
    let alreadyOpened = false;
    if (opensModule) {
      const prior = await supabase
        .from("quiz_submissions")
        .select("score")
        .eq("user_id", user.id)
        .eq("test_id", testId);
      if (prior.error) {
        console.error("[quiz/submit] prior scores", prior.error.message);
        alreadyOpened = true;
      } else {
        alreadyOpened = (prior.data ?? []).some((row) => Number(row.score) >= minPercent);
      }
    }

    const { data, error } = await supabase
      .from("quiz_submissions")
      .insert({
        test_id: testId,
        user_id: user.id,
        score: roundedScore,
        answers: answers as Record<string, unknown>,
        review: review as Record<string, unknown>,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[quiz/submit]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (opensModule && !alreadyOpened && user.email) {
      const mail = buildQuizUnlockEmail({ score: roundedScore, moduleName: openedModule });
      const sent = await sendEmail({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
        from: EDGE_COCKPIT_FROM,
        skipBcc: true,
      });
      if (!sent.success) console.error("[quiz/submit] unlock email", sent.error);
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("[quiz/submit]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
