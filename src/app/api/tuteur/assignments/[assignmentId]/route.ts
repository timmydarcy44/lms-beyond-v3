import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeTutorAssignment } from "@/lib/demo/jade-tutor-demo";
import { loadTutorAssignmentDetail } from "@/lib/tuteur/workspace-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { assignmentId } = await params;
  if (isJadeDemoEmail(auth.ctx.email)) {
    const demo = jadeTutorAssignment(assignmentId);
    if (!demo) return NextResponse.json({ error: "Rattachement introuvable" }, { status: 404 });
    return NextResponse.json(demo);
  }
  const detail = await loadTutorAssignmentDetail(auth.ctx.supabase, auth.ctx.userId, assignmentId);
  if (!detail) {
    return NextResponse.json({ error: "Rattachement introuvable" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
