import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeMissionsBoard } from "@/lib/demo/jade-tutor-pages";
import { listBlocks, listLearnerReferentials, listTutorMissions } from "@/lib/tuteur/followup-server";
import { notifyLearnerMissionAssigned } from "@/lib/tuteur/mission-emails";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";
import { getServiceRoleClient } from "@/lib/supabase/server";

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
      skillId: item?.skillId ? String(item.skillId) : "",
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

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const db = getServiceRoleClient() ?? auth.ctx.supabase;
  const ids: string[] = [];
  for (const item of items) {
    const dueDate = item.dueDate ? new Date(item.dueDate) : null;
    const dueIso =
      dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : null;
    const blockId = item.blockId && isUuid(item.blockId) ? item.blockId : null;
    const skillId = item.skillId && isUuid(item.skillId) ? item.skillId : null;
    const payload = {
      assignment_id: assignmentId,
      title: item.title,
      instructions: item.description || null,
      due_date: dueIso,
      status: "assigned",
      competency_block_id: blockId,
      competency_code: item.blockCode || null,
      competency_label: item.blockTitle || null,
      deliverable: item.deliverable || null,
      skill_id: skillId,
    };
    let inserted = await db.from("tutor_missions").insert(payload).select("id").single();
    if (inserted.error) {
      // Status v2/v3, colonnes optionnelles, ou FK UUID absentes
      inserted = await db
        .from("tutor_missions")
        .insert({
          assignment_id: assignmentId,
          title: item.title,
          instructions: payload.instructions,
          due_date: payload.due_date,
          status: "todo",
          competency_code: payload.competency_code,
          deliverable: payload.deliverable,
        })
        .select("id")
        .single();
    }
    if (inserted.error || !inserted.data) {
      return NextResponse.json(
        { error: inserted.error?.message || "Création impossible" },
        { status: 500 },
      );
    }
    ids.push(String(inserted.data.id));
  }

  const mailDb = getServiceRoleClient() ?? auth.ctx.supabase;
  void notifyLearnerMissionAssigned({
    db: mailDb,
    learnerId: String((owned.data as { learner_id: string }).learner_id),
    tutorName: auth.ctx.tutorName,
    missions: items.map((item) => ({ title: item.title, dueDate: item.dueDate || null })),
  }).catch((err) => console.warn("[tuteur/missions-board] mail assign", err));

  return NextResponse.json({ ids });
}
