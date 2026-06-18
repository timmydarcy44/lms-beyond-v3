import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import {
  buildSoftSkillsPayload,
  saveSoftSkillsResultats,
  validateSoftSkillsAnswers,
} from "@/lib/soft-skills/save-soft-skills";

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

    const validationError = validateSoftSkillsAnswers(answers ?? {});
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const payload = buildSoftSkillsPayload(user.id, answers);
    const { scores, total_score: totalScore } = payload;

    const upsertResult = await saveSoftSkillsResultats(supabase, user.id, answers);
    if (upsertResult.error) {
      console.error("[soft-skills/submit]", upsertResult.error);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement", details: upsertResult.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      result_id: null,
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
