import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeEvaluationDetail } from "@/lib/demo/jade-tutor-pages";
import { loadEvaluation } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { id } = await params;
  if (isJadeDemoEmail(auth.ctx.email)) {
    const detail = jadeEvaluationDetail(id);
    if (!detail) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
    return NextResponse.json(detail);
  }
  const detail = await loadEvaluation(auth.ctx.supabase, auth.ctx.userId, id);
  if (!detail) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
  const selfVisible = Boolean(detail.evaluation.self_sent_at);
  return NextResponse.json({
    ...detail,
    items: (detail.items ?? []).map((item) => ({
      ...item,
      self_level: selfVisible ? item.self_level : null,
    })),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { id } = await params;
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json({ ok: true });
  const detail = await loadEvaluation(auth.ctx.supabase, auth.ctx.userId, id);
  if (!detail) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
  if (detail.evaluation.status === "sent") return NextResponse.json({ error: "Cette évaluation est déjà envoyée" }, { status: 409 });
  const body = await request.json().catch(() => null);
  const send = Boolean(body?.send);
  const levels = Array.isArray(body?.levels) ? body.levels : [];
  for (const level of levels) {
    if (level.tutorLevel == null) continue;
    await auth.ctx.supabase.from("evaluation_items").update({ tutor_level: Number(level.tutorLevel) }).eq("id", String(level.id)).eq("evaluation_id", id);
  }
  if (body?.comment != null) {
    await auth.ctx.supabase.from("evaluations").update({ general_comment: String(body.comment) }).eq("id", id);
  }
  if (!send) return NextResponse.json({ ok: true });
  const fresh = await auth.ctx.supabase.from("evaluation_items").select("tutor_level").eq("evaluation_id", id);
  if (!(fresh.data ?? []).length || (fresh.data ?? []).some((item) => item.tutor_level == null)) {
    return NextResponse.json({ error: "Tous les critères doivent être renseignés" }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const booklet = await auth.ctx.supabase
    .from("apprenticeship_booklets")
    .select("id")
    .eq("student_id", detail.evaluation.student_id)
    .eq("tutor_id", auth.ctx.userId)
    .maybeSingle();
  let bookletPeriodId: string | null = null;
  if (booklet.data?.id) {
    const period = await auth.ctx.supabase
      .from("booklet_periods")
      .select("id")
      .eq("booklet_id", booklet.data.id)
      .lte("start_date", today)
      .gte("end_date", today)
      .maybeSingle();
    bookletPeriodId = period.data?.id ? String(period.data.id) : null;
  }
  await auth.ctx.supabase
    .from("evaluations")
    .update({ status: "sent", sent_at: new Date().toISOString(), booklet_period_id: bookletPeriodId })
    .eq("id", id);
  await auth.ctx.supabase.from("notifications").insert({
    user_id: detail.evaluation.student_id,
    type: "info",
    title: "Évaluation envoyée",
    message: "Votre tuteur a envoyé une évaluation.",
    read: false,
  });
  return NextResponse.json({ ok: true });
}
