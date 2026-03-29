import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { SOFT_SKILLS, SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills";

type AnswerPayload = {
  learner_id?: string;
  answers: Record<string, number>;
};

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

    const body = (await request.json()) as AnswerPayload;
    const answers = body.answers;

    const expectedKeys = new Set(SOFT_SKILLS_QUESTIONS.map((q) => q.id));
    const answerKeys = answers ? Object.keys(answers) : [];

    if (!answers || answerKeys.length !== SOFT_SKILLS_QUESTIONS.length) {
      return NextResponse.json({ error: "Réponses invalides" }, { status: 400 });
    }

    for (const key of answerKeys) {
      const value = answers[key];
      if (!expectedKeys.has(key) || typeof value !== "number" || value < 1 || value > 5) {
        return NextResponse.json({ error: "Réponses invalides" }, { status: 400 });
      }
    }

    const scores: Record<string, number> = {};
    for (let compId = 1; compId <= SOFT_SKILLS.length; compId += 1) {
      const skill = SOFT_SKILLS[compId - 1];
      const total =
        (answers[`${compId}_1`] || 0) + (answers[`${compId}_2`] || 0) + (answers[`${compId}_3`] || 0);
      scores[skill.titre] = total;
    }

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    const payload = {
      learner_id: user.id,
      answers,
      scores,
      total_score: totalScore,
      taken_at: new Date().toISOString(),
    };

    let data: { id?: string | null } & typeof payload | null = null;
    const upsertResult = await supabase
      .from("soft_skills_resultats")
      .upsert(payload, { onConflict: "learner_id" })
      .select()
      .maybeSingle();

    if (upsertResult.error) {
      const message = upsertResult.error.message || "";
      console.error("[soft-skills/submit]", upsertResult.error);

      if (message.includes("unique") || message.includes("constraint")) {
        const { error: deleteError } = await supabase
          .from("soft_skills_resultats")
          .delete()
          .eq("learner_id", user.id);
        if (deleteError) {
          console.error("[soft-skills/submit-delete]", deleteError);
        }
        const fallbackInsert = await supabase
          .from("soft_skills_resultats")
          .insert(payload)
          .select()
          .maybeSingle();
        if (fallbackInsert.error) {
          console.error("[soft-skills/submit-fallback]", fallbackInsert.error);
          return NextResponse.json(
            { error: "Erreur lors de l'enregistrement", details: fallbackInsert.error.message },
            { status: 500 },
          );
        }
        data = fallbackInsert.data;
      } else {
        return NextResponse.json(
          { error: "Erreur lors de l'enregistrement", details: upsertResult.error.message },
          { status: 500 },
        );
      }
    } else {
      data = upsertResult.data;
    }

    const resultId = (data as { id?: string | null } | null)?.id ?? null;

    return NextResponse.json({
      result_id: resultId,
      learner_id: user.id,
      total_score: totalScore,
      scores,
      taken_at: payload.taken_at,
    });
  } catch (error) {
    console.error("DÉTAIL ERREUR SUBMIT:", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
