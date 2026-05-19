import { NextResponse } from "next/server";

import { buildTutorWorkspace } from "@/lib/tuteur/workspace-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const payload = await buildTutorWorkspace(auth.ctx.supabase, auth.ctx.userId, auth.ctx.tutorName);
  return NextResponse.json(payload);
}
