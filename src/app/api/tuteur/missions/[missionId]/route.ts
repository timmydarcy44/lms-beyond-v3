import { NextRequest, NextResponse } from "next/server";

import { recordTutorValidatedProof } from "@/lib/tuteur/skill-proof";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

function mapBodyStatutToDb(statut: string): "todo" | "in_progress" | "done" | "invalid" | "validated" | "correction_requested" | null {
  const v = String(statut ?? "").toUpperCase().replace(/\s/g, "_");
  if (v === "VALIDEE" || v === "DONE" || v === "VALIDÉE") return "validated";
  if (v === "EN_COURS" || v === "IN_PROGRESS") return "in_progress";
  if (v === "INVALIDEE" || v === "INVALID" || v === "CORRECTION_REQUESTED") return "correction_requested";
  if (v === "TODO" || v === "A_FAIRE" || v === "EN_ATTENTE") return "todo";
  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { missionId } = await params;
  const { data: mission, error } = await auth.ctx.supabase
    .from("tutor_missions")
    .select("id, assignment_id, title, instructions, status, due_date, invalidation_reason, created_at")
    .eq("id", missionId)
    .maybeSingle();

  if (error || !mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  return NextResponse.json(mission);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { missionId } = await params;
  let body: { statut?: string; motif?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const dbStatus = mapBodyStatutToDb(String(body.statut ?? ""));
  if (!dbStatus) {
    return NextResponse.json({ error: "Statut inconnu" }, { status: 400 });
  }

  if ((dbStatus === "invalid" || dbStatus === "correction_requested") && !String(body.motif ?? "").trim()) {
    return NextResponse.json({ error: "Motif obligatoire pour une invalidation" }, { status: 400 });
  }

  const supabase = auth.ctx.supabase;
  const userId = auth.ctx.userId;

  const { data: existing, error: fetchErr } = await supabase
    .from("tutor_missions")
    .select("id, assignment_id, status, title")
    .eq("id", missionId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const { data: assignment } = await supabase
    .from("tutor_assignments")
    .select("id, tutor_id, learner_id")
    .eq("id", existing.assignment_id)
    .maybeSingle();
  if (!assignment || assignment.tutor_id !== userId) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {
    status: dbStatus,
  };

  const validated = dbStatus === "done" || dbStatus === "validated";
  const correction = dbStatus === "invalid" || dbStatus === "correction_requested";
  if (validated) {
    updatePayload.completed_at = new Date().toISOString();
    updatePayload.validated_at = new Date().toISOString();
    updatePayload.tutor_comment = String(body.motif ?? "").trim() || null;
    updatePayload.invalidation_reason = null;
  } else if (correction) {
    updatePayload.invalidation_reason = String(body.motif ?? "").trim();
    updatePayload.completed_at = null;
  } else {
    updatePayload.invalidation_reason = null;
    updatePayload.completed_at = null;
  }

  let updatedResult = await supabase
    .from("tutor_missions")
    .update(updatePayload)
    .eq("id", missionId)
    .select("id, status, completed_at, invalidation_reason")
    .single();

  if (updatedResult.error && (updatedResult.error.code === "42703" || updatedResult.error.code === "23514")) {
    const fallback = { ...updatePayload };
    delete fallback.validated_at;
    delete fallback.tutor_comment;
    if (fallback.status === "correction_requested") fallback.status = "invalid";
    if (fallback.status === "validated") fallback.status = "done";
    updatedResult = await supabase
      .from("tutor_missions")
      .update(fallback)
      .eq("id", missionId)
      .select("id, status, completed_at, invalidation_reason")
      .single();
  }
  const updated = updatedResult.data;
  const upErr = updatedResult.error;

  if (upErr) {
    console.error("[tuteur/missions PATCH]", upErr);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }

  const logType = validated ? "validation" : correction ? "blocking" : "update";
  const logContent = validated
    ? "Mission validée par le tuteur"
    : correction
      ? String(body.motif ?? "").trim()
      : `Statut : ${dbStatus}`;

  await supabase.from("tutor_mission_logs").insert({
    mission_id: missionId,
    author_id: userId,
    entry_type: logType,
    content: logContent,
  });

  if (validated) {
    let label = String(existing.title ?? "").trim();
    const labeled = await supabase.from("tutor_missions").select("competency_label").eq("id", missionId).maybeSingle();
    if (!labeled.error && labeled.data?.competency_label) label = String(labeled.data.competency_label);
    const note = String(body.motif ?? "").trim() || "Validée par le tuteur";
    await recordTutorValidatedProof(String(assignment.learner_id), label, note);
    await supabase.from("notifications").insert({
      user_id: assignment.learner_id,
      type: "info",
      title: "Mission validée",
      message: `${label} a été validée par votre tuteur.`,
      read: false,
    });
  } else if (correction) {
    await supabase.from("notifications").insert({
      user_id: assignment.learner_id,
      type: "info",
      title: "Correction demandée",
      message: String(body.motif ?? "").trim() || "Votre tuteur demande une correction.",
      read: false,
    });
  }

  return NextResponse.json({
    id: updated?.id ?? missionId,
    updated: true,
    status: updated?.status,
  });
}
