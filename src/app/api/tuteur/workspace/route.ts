import { NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { JADE_TUTOR_WORKSPACE } from "@/lib/demo/jade-tutor-demo";
import { buildTutorWorkspace } from "@/lib/tuteur/workspace-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json(JADE_TUTOR_WORKSPACE);

  const payload = await buildTutorWorkspace(auth.ctx.supabase, auth.ctx.userId, auth.ctx.tutorName);
  return NextResponse.json(payload);
}
