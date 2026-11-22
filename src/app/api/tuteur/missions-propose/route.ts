import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { listLearnerReferentials } from "@/lib/tuteur/followup-server";
import { proposeMissionsWithLlm } from "@/lib/tuteur/propose-missions-llm";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function POST(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const assignmentId = String(body?.assignmentId ?? "").trim();
  if (!assignmentId) {
    return NextResponse.json({ error: "Alternant requis" }, { status: 400 });
  }

  if (isJadeDemoEmail(auth.ctx.email)) {
    const refs = await listLearnerReferentials(auth.ctx.supabase, auth.ctx.userId);
    const linked = refs.find((row) => row.assignmentId === assignmentId);
    return NextResponse.json({
      missions: linked?.referential?.missions ?? [],
      source: "demo",
      company: linked?.referential?.company ?? null,
    });
  }

  const refs = await listLearnerReferentials(auth.ctx.supabase, auth.ctx.userId);
  const linked = refs.find((row) => row.assignmentId === assignmentId);
  if (!linked?.referential) {
    return NextResponse.json(
      { error: "Aucun référentiel / fiche cursus pour cet alternant." },
      { status: 404 },
    );
  }

  const skills = linked.referential.blocks.map((block) => {
    const mission = linked.referential!.missions.find((m) => m.id === block.id || m.code === block.code);
    return {
      id: block.id,
      code: block.code,
      title: block.title,
      brief: mission?.description || block.title,
    };
  });

  const missions = await proposeMissionsWithLlm(skills, linked.referential.company);
  return NextResponse.json({
    missions,
    source: "ai",
    company: linked.referential.company,
    title: linked.referential.title,
  });
}
