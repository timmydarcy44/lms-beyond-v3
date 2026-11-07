import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";
import { scoreAssessmentAnswers } from "@/lib/formation-assessments/score";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { token } = await ctx.params;
  const { data: attempt } = await service
    .from("formation_assessment_attempts")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();
  if (!attempt) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });

  const { data: template } = await service
    .from("formation_assessment_templates")
    .select("title, questions")
    .eq("kind", attempt.kind)
    .maybeSingle();

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("course_title")
    .eq("id", attempt.dossier_id)
    .maybeSingle();

  const questions = (template?.questions ?? []) as AssessmentQuestion[];

  return NextResponse.json({
    kind: attempt.kind,
    title: template?.title ?? attempt.kind,
    status: attempt.status,
    score_pct: attempt.score_pct,
    course_title: dossier?.course_title ?? null,
    questions,
    answers: attempt.answers ?? {},
    completed_at: attempt.completed_at,
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { token } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    answers?: Record<string, unknown>;
    complete?: boolean;
  } | null;

  const { data: attempt } = await service
    .from("formation_assessment_attempts")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();
  if (!attempt) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  if (attempt.status === "completed") {
    return NextResponse.json({ error: "Déjà complété", code: "already_completed" }, { status: 409 });
  }

  const { data: template } = await service
    .from("formation_assessment_templates")
    .select("questions")
    .eq("kind", attempt.kind)
    .maybeSingle();
  const questions = (template?.questions ?? []) as AssessmentQuestion[];

  const merged = {
    ...((attempt.answers as Record<string, unknown>) || {}),
    ...(body?.answers || {}),
  };

  const now = new Date().toISOString();
  const complete = Boolean(body?.complete);
  const score = complete ? scoreAssessmentAnswers(questions, merged) : null;

  const { data: updated, error } = await service
    .from("formation_assessment_attempts")
    .update({
      answers: merged,
      status: complete ? "completed" : "in_progress",
      started_at: attempt.started_at || now,
      completed_at: complete ? now : null,
      score_pct: score,
      updated_at: now,
    })
    .eq("id", attempt.id)
    .select("id, status, score_pct, completed_at")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message || "Enregistrement impossible" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    status: updated.status,
    score_pct: updated.score_pct,
    completed_at: updated.completed_at,
  });
}
