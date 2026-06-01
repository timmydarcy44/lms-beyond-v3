import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import {
  getIsoWeekId,
  getQuestionOfWeek,
} from "@/lib/radar-equipe/micro-checkin-questions";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const question = getQuestionOfWeek();
  const semaine = getIsoWeekId();

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("micro_checkins")
    .select("id")
    .eq("collaborateur_id", user.id)
    .eq("semaine_iso", semaine)
    .eq("question_id", question.id)
    .maybeSingle();

  return NextResponse.json({
    semaine,
    question,
    dejaRepondu: Boolean(existing),
    messageAnonymat:
      "Votre réponse est anonyme et ne sera jamais communiquée individuellement à votre employeur.",
  });
}

export async function POST(request: NextRequest) {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { questionId?: string; score?: number; equipeId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const question = getQuestionOfWeek();
  const questionId = body.questionId ?? question.id;
  const score = Number(body.score);
  if (!Number.isInteger(score) || score < 1 || score > 4) {
    return NextResponse.json({ error: "Score invalide (1-4)" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  let equipeId = body.equipeId;
  if (!equipeId && profile?.company_id && service) {
    const { data: eq } = await service
      .from("equipes")
      .select("id")
      .eq("organisation_id", profile.company_id)
      .limit(1)
      .maybeSingle();
    equipeId = eq?.id as string | undefined;
  }

  if (!equipeId) {
    return NextResponse.json({ error: "Équipe non trouvée" }, { status: 400 });
  }

  const { error } = await supabase.from("micro_checkins").upsert(
    {
      collaborateur_id: user.id,
      equipe_id: equipeId,
      semaine_iso: getIsoWeekId(),
      question_id: questionId,
      dimension: question.dimension,
      score,
    },
    { onConflict: "collaborateur_id,semaine_iso,question_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
