import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeMissionsBoard } from "@/lib/demo/jade-tutor-pages";
import { listBlocks, listLearnerReferentials, listTutorMissions, relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json(jadeMissionsBoard());
  const [missions, blocks, referentials] = await Promise.all([
    listTutorMissions(auth.ctx.supabase, auth.ctx.userId),
    listBlocks(auth.ctx.supabase),
    listLearnerReferentials(auth.ctx.supabase, auth.ctx.userId),
  ]);
  const assignments = referentials.map((row) => ({ id: row.assignmentId, learner_id: row.learnerId, learnerName: row.learnerName }));
  return NextResponse.json({ missions, blocks, assignments, referentials });
}

export async function POST(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const body = await request.json().catch(() => null);
  const assignmentId = String(body?.assignmentId ?? "");
  const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : [body];
  const items = rawItems
    .map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
      title: String(item?.title ?? "").trim(),
      description: String(item?.description ?? "").trim(),
      dueDate: item?.dueDate ? String(item.dueDate) : "",
      deliverable: String(item?.deliverable ?? "").trim(),
      blockId: item?.blockId ? String(item.blockId) : "",
      blockCode: item?.blockCode ? String(item.blockCode) : "",
      blockTitle: item?.blockTitle ? String(item.blockTitle) : "",
      };
    })
    .filter((item) => item.title);
  if (!assignmentId || !items.length) return NextResponse.json({ error: "Titre et alternant requis" }, { status: 400 });
  if (isJadeDemoEmail(auth.ctx.email)) {
    const board = jadeMissionsBoard();
    const learner = board.referentials.find((row) => row.assignmentId === assignmentId);
    const created = items.map((item, index) => ({
      id: `m-jade-${Date.now()}-${index}`,
      assignmentId,
      learnerId: learner?.learnerId ?? "",
      learnerName: learner?.learnerName ?? "Alternant",
      title: item.title,
      instructions: item.description || null,
      blockCode: item.blockCode || null,
      dueDate: item.dueDate || null,
      status: "todo",
      late: false,
      deliverable: item.deliverable || null,
      submittedAt: null,
      validatedAt: null,
    }));
    return NextResponse.json({ created });
  }
  const owned = await auth.ctx.supabase
    .from("tutor_assignments")
    .select("id, learner_id")
    .eq("id", assignmentId)
    .eq("tutor_id", auth.ctx.userId)
    .maybeSingle();
  if (!owned.data) return NextResponse.json({ error: "Alternant introuvable" }, { status: 404 });
  const ids: string[] = [];
  for (const item of items) {
    const payload = {
      assignment_id: assignmentId,
      title: item.title,
      instructions: item.description || null,
      due_date: item.dueDate ? new Date(item.dueDate).toISOString() : null,
      status: "todo",
      competency_block_id: item.blockId || null,
      competency_code: item.blockCode || null,
      competency_label: item.blockTitle || null,
      deliverable: item.deliverable || null,
    };
    let inserted = await auth.ctx.supabase.from("tutor_missions").insert(payload).select("id").single();
    if (relationMissing(inserted.error)) {
      inserted = await auth.ctx.supabase
        .from("tutor_missions")
        .insert({ assignment_id: assignmentId, title: item.title, instructions: payload.instructions, due_date: payload.due_date, status: "todo" })
        .select("id")
        .single();
    }
    if (inserted.error || !inserted.data) return NextResponse.json({ error: "Création impossible" }, { status: 500 });
    ids.push(String(inserted.data.id));
  }
  return NextResponse.json({ ids });
}
