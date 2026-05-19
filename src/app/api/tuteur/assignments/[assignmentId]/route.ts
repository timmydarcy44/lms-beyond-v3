import { NextRequest, NextResponse } from "next/server";

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
  const detail = await loadTutorAssignmentDetail(auth.ctx.supabase, auth.ctx.userId, assignmentId);
  if (!detail) {
    return NextResponse.json({ error: "Rattachement introuvable" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
