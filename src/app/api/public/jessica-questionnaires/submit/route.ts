import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { scoreJessicaAnswers } from "@/lib/jessica-contentin/questionnaires";
import { resolveJessicaQuestionnaire } from "@/lib/queries/jessica-questionnaires";

type Body = {
  questionnaireSlug?: string;
  answers?: Record<string, unknown>;
  inviteToken?: string | null;
  respondentEmail?: string | null;
  respondentFirstName?: string | null;
  respondentLastName?: string | null;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const slug = body?.questionnaireSlug?.trim() ?? "";
  const answers = body?.answers ?? {};
  if (!slug) return NextResponse.json({ error: "Questionnaire manquant" }, { status: 400 });

  const def = await resolveJessicaQuestionnaire(slug);
  if (!def) return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

  let invite: Record<string, unknown> | null = null;
  const token = body?.inviteToken?.trim();
  if (token) {
    const { data } = await supabase
      .from("jessica_questionnaire_invites")
      .select("*")
      .eq("token", token)
      .eq("questionnaire_slug", slug)
      .maybeSingle();
    invite = data as Record<string, unknown> | null;
    if (!invite) return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
    if (invite.completed_at) {
      return NextResponse.json({ error: "Questionnaire déjà complété" }, { status: 409 });
    }
  }

  const { score, scoreLabel } = scoreJessicaAnswers(slug, answers, def.questions);
  const questionnaireId = "id" in def ? (def as { id?: string }).id : null;

  const email =
    (invite?.recipient_email as string | undefined) ||
    body?.respondentEmail?.trim().toLowerCase() ||
    null;
  const firstName =
    (invite?.recipient_first_name as string | undefined) ||
    body?.respondentFirstName?.trim() ||
    null;
  const lastName =
    (invite?.recipient_last_name as string | undefined) ||
    body?.respondentLastName?.trim() ||
    null;

  const { data, error } = await supabase
    .from("jessica_questionnaire_responses")
    .insert({
      questionnaire_slug: slug,
      questionnaire_id: questionnaireId ?? (invite?.questionnaire_id as string | null) ?? null,
      respondent_email: email,
      respondent_first_name: firstName,
      respondent_last_name: lastName,
      cabinet_patient_id: (invite?.cabinet_patient_id as string | null) ?? null,
      profile_id: (invite?.profile_id as string | null) ?? null,
      answers,
      score,
      score_label: scoreLabel,
      submitted_at: new Date().toISOString(),
      source: token ? "invite" : "public",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[public jessica submit]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (invite?.id) {
    await supabase
      .from("jessica_questionnaire_invites")
      .update({
        completed_at: new Date().toISOString(),
        response_id: data.id,
      })
      .eq("id", invite.id);
  }

  return NextResponse.json({ ok: true, id: data.id, score, scoreLabel });
}
