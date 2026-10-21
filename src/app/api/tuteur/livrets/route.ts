import { NextRequest, NextResponse } from "next/server";

import { loadBookletBoard } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const studentId = new URL(request.url).searchParams.get("alternant");
  const board = await loadBookletBoard(auth.ctx.supabase, auth.ctx.userId, studentId);
  return NextResponse.json({ ...board, tutorName: auth.ctx.tutorName });
}
