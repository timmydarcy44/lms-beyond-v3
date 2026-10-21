import { NextRequest, NextResponse } from "next/server";

import { listBlocks, listTutorMissions, relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const [missions, blocks] = await Promise.all([
    listTutorMissions(auth.ctx.supabase, auth.ctx.userId),
    listBlocks(auth.ctx.supabase),
  ]);
  const assignments = await auth.ctx.supabase
    .from("tutor_assignments")
    .select("id, learner_id")
    .eq("tutor_id", auth.ctx.userId)
    .in("status", ["active", "paused"]);
  return NextResponse.json({ missions, blocks, assignments: assignments.data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const body = await request.json().catch(() => null);
  const assignmentId = String(body?.assignmentId ?? "");
  const title = String(body?.title ?? "").trim();
  if (!assignmentId || !title) return NextResponse.json({ error: "Titre et alternant requis" }, { status: 400 });
  const owned = await auth.ctx.supabase
    .from("tutor_assignments")
    .select("id")
    .eq("id", assignmentId)
    .eq("tutor_id", auth.ctx.userId)
    .maybeSingle();
  if (!owned.data) return NextResponse.json({ error: "Alternant introuvable" }, { status: 404 });
  const payload = {
    assignment_id: assignmentId,
    title,
    instructions: String(body?.description ?? "").trim() || null,
    due_date: body?.dueDate ? new Date(String(body.dueDate)).toISOString() : null,
    status: "todo",
    competency_block_id: body?.blockId || null,
    competency_code: body?.blockCode || null,
    competency_label: body?.blockTitle || null,
    deliverable: String(body?.deliverable ?? "").trim() || null,
  };
  let inserted = await auth.ctx.supabase.from("tutor_missions").insert(payload).select("id").single();
  if (relationMissing(inserted.error)) {
    inserted = await auth.ctx.supabase
      .from("tutor_missions")
      .insert({ assignment_id: assignmentId, title, instructions: payload.instructions, due_date: payload.due_date, status: "todo" })
      .select("id")
      .single();
  }
  if (inserted.error || !inserted.data) return NextResponse.json({ error: "Création impossible" }, { status: 500 });
  return NextResponse.json({ id: inserted.data.id });
}
