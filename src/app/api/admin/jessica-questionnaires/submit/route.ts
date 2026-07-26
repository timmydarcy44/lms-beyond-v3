import { NextRequest, NextResponse } from "next/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { scoreJessicaAnswers } from "@/lib/jessica-contentin/questionnaires";
import { resolveJessicaQuestionnaire } from "@/lib/queries/jessica-questionnaires";

type Body = {
  questionnaireSlug?: string;
  answers?: Record<string, unknown>;
  respondentEmail?: string | null;
  respondentFirstName?: string | null;
  respondentLastName?: string | null;
  childFirstName?: string | null;
  childLastName?: string | null;
  cabinetPatientId?: string | null;
  profileId?: string | null;
};

export async function POST(req: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Body | null;
  const slug = body?.questionnaireSlug?.trim() ?? "";
  const def = await resolveJessicaQuestionnaire(slug);
  if (!def) return NextResponse.json({ error: "Questionnaire inconnu" }, { status: 400 });

  const answers = body?.answers ?? {};
  const { score, scoreLabel } = scoreJessicaAnswers(slug, answers, def.questions);

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Supabase indisponible" }, { status: 500 });

  const childFirst =
    body?.childFirstName?.trim() ||
    (typeof answers[`${slug}_prenom_de_l_enfant_2`] === "string"
      ? String(answers[`${slug}_prenom_de_l_enfant_2`])
      : null);
  const childLast =
    body?.childLastName?.trim() ||
    (typeof answers[`${slug}_nom_de_l_enfant_1`] === "string"
      ? String(answers[`${slug}_nom_de_l_enfant_1`])
      : null);

  const questionnaireId = "id" in def ? (def as { id?: string }).id : undefined;

  const { data, error } = await supabase
    .from("jessica_questionnaire_responses")
    .insert({
      questionnaire_slug: slug,
      questionnaire_id: questionnaireId ?? null,
      respondent_email: body?.respondentEmail?.trim().toLowerCase() || null,
      respondent_first_name: body?.respondentFirstName?.trim() || null,
      respondent_last_name: body?.respondentLastName?.trim() || null,
      child_first_name: childFirst,
      child_last_name: childLast,
      cabinet_patient_id: body?.cabinetPatientId || null,
      profile_id: body?.profileId || null,
      answers,
      score,
      score_label: scoreLabel,
      submitted_at: new Date().toISOString(),
      source: "crm",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[jessica-questionnaires/submit]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, score, scoreLabel });
}
