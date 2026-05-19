import { NextRequest, NextResponse } from "next/server";

import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string; formId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { assignmentId, formId } = await params;
  const supabase = auth.ctx.supabase;

  const { data: assignment, error: aErr } = await supabase
    .from("tutor_assignments")
    .select("id, learner_id, tutor_id, organization_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (aErr || !assignment || (assignment as { tutor_id: string }).tutor_id !== auth.ctx.userId) {
    return NextResponse.json({ error: "Rattachement introuvable" }, { status: 404 });
  }

  const { data: form, error: fErr } = await supabase
    .from("tutor_followup_forms")
    .select("id, title, description, active, organization_id")
    .eq("id", formId)
    .maybeSingle();

  if (fErr || !form || !(form as { active: boolean }).active) {
    return NextResponse.json({ error: "Formulaire introuvable" }, { status: 404 });
  }

  const orgId = (assignment as { organization_id: string | null }).organization_id;
  const formOrgId = (form as { organization_id: string | null }).organization_id ?? null;
  if (formOrgId !== null && formOrgId !== orgId) {
    return NextResponse.json({ error: "Formulaire non disponible pour ce rattachement" }, { status: 403 });
  }

  const { data: questions, error: qErr } = await supabase
    .from("tutor_followup_questions")
    .select("id, question, question_type, order_index, metadata")
    .eq("form_id", formId)
    .order("order_index", { ascending: true });

  if (qErr) {
    return NextResponse.json({ error: "Impossible de charger les questions" }, { status: 500 });
  }

  const { data: responses } = await supabase
    .from("tutor_followup_responses")
    .select("id, question_id, response, created_at")
    .eq("assignment_id", assignmentId)
    .eq("form_id", formId);

  return NextResponse.json({
    form: { id: formId, title: (form as { title: string }).title, description: (form as { description: string | null }).description },
    questions: questions ?? [],
    responses: responses ?? [],
    learnerId: (assignment as { learner_id: string }).learner_id,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string; formId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { assignmentId, formId } = await params;
  const supabase = auth.ctx.supabase;
  const tutorId = auth.ctx.userId;

  let body: { answers?: Array<{ question_id: string; response: unknown }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (!answers.length) {
    return NextResponse.json({ error: "Réponses vides" }, { status: 400 });
  }

  const { data: assignment, error: aErr } = await supabase
    .from("tutor_assignments")
    .select("id, learner_id, tutor_id, organization_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (aErr || !assignment || (assignment as { tutor_id: string }).tutor_id !== tutorId) {
    return NextResponse.json({ error: "Rattachement introuvable" }, { status: 404 });
  }

  const { data: formRow } = await supabase
    .from("tutor_followup_forms")
    .select("id, active, organization_id")
    .eq("id", formId)
    .maybeSingle();

  if (!(formRow as { active?: boolean } | null)?.active) {
    return NextResponse.json({ error: "Formulaire introuvable" }, { status: 404 });
  }

  const orgId = (assignment as { organization_id: string | null }).organization_id;
  const formOrgId = (formRow as { organization_id: string | null }).organization_id ?? null;
  if (formOrgId !== null && formOrgId !== orgId) {
    return NextResponse.json({ error: "Formulaire non disponible pour ce rattachement" }, { status: 403 });
  }

  const learnerId = (assignment as { learner_id: string }).learner_id;

  for (const row of answers) {
    const qid = String(row.question_id ?? "").trim();
    if (!qid) continue;
    const { data: existing } = await supabase
      .from("tutor_followup_responses")
      .select("id")
      .eq("assignment_id", assignmentId)
      .eq("form_id", formId)
      .eq("question_id", qid)
      .maybeSingle();

    const payload = {
      form_id: formId,
      question_id: qid,
      assignment_id: assignmentId,
      tutor_id: tutorId,
      learner_id: learnerId,
      response: row.response ?? null,
    };

    if (existing?.id) {
      const { error: uErr } = await supabase
        .from("tutor_followup_responses")
        .update({ response: payload.response })
        .eq("id", existing.id as string);
      if (uErr) {
        console.error("[tuteur form POST] update", uErr);
        return NextResponse.json({ error: "Enregistrement partiel en échec" }, { status: 500 });
      }
    } else {
      const { error: iErr } = await supabase.from("tutor_followup_responses").insert(payload);
      if (iErr) {
        console.error("[tuteur form POST] insert", iErr);
        return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
