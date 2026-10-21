import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeEvaluations } from "@/lib/demo/jade-tutor-pages";
import { listBlocks, listEvaluations } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json(jadeEvaluations());
  const evaluations = await listEvaluations(auth.ctx.supabase, auth.ctx.userId);
  return NextResponse.json({ evaluations });
}

export async function POST(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const body = await request.json().catch(() => null);
  const studentId = String(body?.studentId ?? "");
  const type = ["quarterly", "trial_period", "final"].includes(String(body?.type)) ? String(body.type) : "quarterly";
  const owned = await auth.ctx.supabase
    .from("tutor_assignments")
    .select("id")
    .eq("tutor_id", auth.ctx.userId)
    .eq("learner_id", studentId)
    .in("status", ["active", "paused"])
    .maybeSingle();
  if (!owned.data) return NextResponse.json({ error: "Alternant introuvable" }, { status: 404 });
  const created = await auth.ctx.supabase
    .from("evaluations")
    .insert({ student_id: studentId, tutor_id: auth.ctx.userId, type, due_date: body?.dueDate ?? null, status: "awaiting_student" })
    .select("id")
    .single();
  if (created.error || !created.data) return NextResponse.json({ error: "Création impossible" }, { status: 500 });
  const blocks = await listBlocks(auth.ctx.supabase);
  const criteria = blocks.length
    ? blocks
    : [];
  if (criteria.length) {
    await auth.ctx.supabase.from("evaluation_items").insert(
      criteria.map((block) => ({
        evaluation_id: created.data.id,
        criterion_id: block.id,
        label: block.title,
        block_code: block.code,
      })),
    );
  }
  return NextResponse.json({ id: created.data.id });
}
