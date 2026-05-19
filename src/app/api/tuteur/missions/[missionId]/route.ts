import { NextRequest, NextResponse } from "next/server";

import { requireTutorClient } from "@/lib/tuteur/require-tutor";

function mapBodyStatutToDb(statut: string): "todo" | "in_progress" | "done" | "invalid" | null {
  const v = String(statut ?? "").toUpperCase().replace(/\s/g, "_");
  if (v === "VALIDEE" || v === "DONE" || v === "VALIDÉE") return "done";
  if (v === "EN_COURS" || v === "IN_PROGRESS") return "in_progress";
  if (v === "INVALIDEE" || v === "INVALID") return "invalid";
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

  if (dbStatus === "invalid" && !String(body.motif ?? "").trim()) {
    return NextResponse.json({ error: "Motif obligatoire pour une invalidation" }, { status: 400 });
  }

  const supabase = auth.ctx.supabase;
  const userId = auth.ctx.userId;

  const { data: existing, error: fetchErr } = await supabase
    .from("tutor_missions")
    .select("id, assignment_id, status")
    .eq("id", missionId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {
    status: dbStatus,
  };

  if (dbStatus === "done") {
    updatePayload.completed_at = new Date().toISOString();
    updatePayload.invalidation_reason = null;
  } else if (dbStatus === "invalid") {
    updatePayload.invalidation_reason = String(body.motif ?? "").trim();
    updatePayload.completed_at = null;
  } else {
    updatePayload.invalidation_reason = null;
    updatePayload.completed_at = null;
  }

  const { data: updated, error: upErr } = await supabase
    .from("tutor_missions")
    .update(updatePayload)
    .eq("id", missionId)
    .select("id, status, completed_at, invalidation_reason")
    .single();

  if (upErr) {
    console.error("[tuteur/missions PATCH]", upErr);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }

  const logType =
    dbStatus === "done" ? "validation" : dbStatus === "invalid" ? "blocking" : "update";
  const logContent =
    dbStatus === "done"
      ? "Mission validée par le tuteur"
      : dbStatus === "invalid"
        ? String(body.motif ?? "").trim()
        : `Statut : ${dbStatus}`;

  await supabase.from("tutor_mission_logs").insert({
    mission_id: missionId,
    author_id: userId,
    entry_type: logType,
    content: logContent,
  });

  return NextResponse.json({
    id: updated?.id ?? missionId,
    updated: true,
    status: updated?.status,
  });
}
