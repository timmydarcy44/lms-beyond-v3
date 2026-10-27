import { NextRequest, NextResponse } from "next/server";
import { scoreJessicaAnswers, getJessicaQuestionnaire } from "@/lib/jessica-contentin/questionnaires";
import { getCareTest } from "@/lib/expert/care-tests";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills/questions";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    questionnaireSlug?: string;
    answers?: Record<string, unknown>;
    inviteToken?: string | null;
  } | null;
  const token = body?.inviteToken?.trim() ?? "";
  const answers = body?.answers ?? {};
  if (!token) return NextResponse.json({ error: "Lien invalide" }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

  const { data: invite } = await db.from("expert_care_invites").select("*").eq("token", token).maybeSingle();
  if (!invite) return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  if (invite.completed_at) return NextResponse.json({ error: "Test déjà complété" }, { status: 409 });

  const test = getCareTest(String(invite.test_slug));
  let score: number | null = null;
  let scoreLabel: string | null = null;
  if (test?.jessicaSlug) {
    const scored = scoreJessicaAnswers(test.jessicaSlug, answers, getJessicaQuestionnaire(test.jessicaSlug)?.questions);
    score = scored.score;
    scoreLabel = scored.scoreLabel;
  } else if (test?.slug === "soft-skills") {
    const values = SOFT_SKILLS_QUESTIONS.map((q) => Number(answers[q.id])).filter((n) => Number.isFinite(n));
    if (values.length) {
      score = Math.round((values.reduce((a, b) => a + b, 0) / (values.length * 4)) * 100);
      scoreLabel = `${score} / 100`;
    }
  }

  const { data: response, error } = await db
    .from("expert_care_responses")
    .insert({
      expert_id: invite.expert_id,
      client_id: invite.client_id,
      invite_id: invite.id,
      test_slug: invite.test_slug,
      answers,
      score,
      score_label: scoreLabel,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db
    .from("expert_care_invites")
    .update({ completed_at: new Date().toISOString(), response_id: response.id })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true, scoreLabel });
}
